#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import subprocess
from flask import Flask, request, render_template, send_file, jsonify
from werkzeug.utils import secure_filename
import time

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB上限
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TIMEOUT'] = 3600  # 1時間のタイムアウト

ALLOWED_EXTENSIONS = {'mp4', 'mp3', 'wav', 'm4a', 'avi', 'mov', 'mkv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({'error': 'ファイルが選択されていません'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'ファイルが選択されていません'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': '対応していないファイル形式です'}), 400

    # ファイル保存
    filename = secure_filename(file.filename)
    timestamp = str(int(time.time()))
    base_name = os.path.splitext(filename)[0]
    ext = os.path.splitext(filename)[1]
    unique_filename = f"{base_name}_{timestamp}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(filepath)

    try:
        # Whisper実行
        model = request.form.get('model', 'medium')
        language = request.form.get('language', 'ja')

        print(f"[INFO] ファイル受信完了: {unique_filename}", flush=True)
        print(f"[INFO] ファイルサイズ: {os.path.getsize(filepath) / 1024 / 1024:.1f} MB", flush=True)
        print(f"[INFO] モデル: {model}, 言語: {language}", flush=True)
        print(f"[INFO] Whisper処理を開始します...", flush=True)

        whisper_cmd = [
            '/Users/touharamomoko/Library/Python/3.9/bin/whisper',
            filepath,
            '--model', model,
            '--language', language,
            '--output_format', 'txt',
            '--output_format', 'srt',
            '--verbose', 'True',  # 詳細ログを表示
            '-o', app.config['UPLOAD_FOLDER']
        ]

        # PATHにHomebrewのbinを追加
        import os as os_module
        env = os_module.environ.copy()
        env['PATH'] = '/opt/homebrew/bin:' + env.get('PATH', '')

        result = subprocess.run(whisper_cmd, check=True, capture_output=True, text=True, env=env)
        print(f"[INFO] Whisper処理完了", flush=True)
        if result.stdout:
            print(f"[WHISPER OUTPUT] {result.stdout}", flush=True)

        # 結果ファイル読み込み
        base_output = os.path.join(app.config['UPLOAD_FOLDER'],
                                   os.path.splitext(unique_filename)[0])
        txt_file = f"{base_output}.txt"
        srt_file = f"{base_output}.srt"

        result_text = ""
        if os.path.exists(txt_file):
            with open(txt_file, 'r', encoding='utf-8') as f:
                result_text = f.read()

        return jsonify({
            'success': True,
            'text': result_text,
            'txt_file': os.path.basename(txt_file),
            'srt_file': os.path.basename(srt_file) if os.path.exists(srt_file) else None
        })

    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'文字起こしに失敗しました: {e.stderr}'}), 500
    except Exception as e:
        return jsonify({'error': f'エラーが発生しました: {str(e)}'}), 500

@app.route('/download/<filename>')
def download(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return jsonify({'error': 'ファイルが見つかりません'}), 404

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    print("=" * 60)
    print("Whisper文字起こしWebアプリを起動しました！")
    print("ブラウザで以下のURLにアクセスしてください：")
    print("http://localhost:8081")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=8081)
