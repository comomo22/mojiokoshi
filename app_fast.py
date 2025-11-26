#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import subprocess
import tempfile
from flask import Flask, request, render_template, send_file, jsonify, Response, stream_with_context
from werkzeug.utils import secure_filename
import time
import json
from faster_whisper import WhisperModel

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB上限
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

ALLOWED_EXTENSIONS = {'mp4', 'mp3', 'wav', 'm4a', 'avi', 'mov', 'mkv'}

# グローバル変数でモデルをキャッシュ
cached_models = {}

def load_model(model_name):
    """モデルをロード（キャッシュ機能付き）- faster-whisper版"""
    if model_name not in cached_models:
        print(f"[INFO] モデル '{model_name}' をロード中...")

        # GPU検出（CUDA, MPS, CPUの順で試す）
        import torch
        if torch.cuda.is_available():
            device = "cuda"
            compute_type = "float16"
            print(f"[INFO] CUDA GPU検出 - GPU処理を使用")
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = "cpu"  # faster-whisperはMPS非対応のためCPUフォールバック
            compute_type = "int8"
            print(f"[INFO] Apple Silicon検出 - 最適化されたCPU処理を使用")
        else:
            device = "cpu"
            compute_type = "int8"
            print(f"[INFO] CPU処理を使用")

        cached_models[model_name] = WhisperModel(
            model_name,
            device=device,
            compute_type=compute_type,
            download_root=os.path.join(os.path.expanduser("~"), ".cache/whisper"),
            num_workers=4
        )
        print(f"[INFO] モデル '{model_name}' のロード完了 (device={device}, compute_type={compute_type})")
    return cached_models[model_name]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_wav(input_path):
    """音声ファイルをWAVに変換（高速化のため）"""
    output_path = input_path.rsplit('.', 1)[0] + '_converted.wav'

    # ffmpegで16kHz, モノラルに変換（Whisperに最適化）
    cmd = [
        'ffmpeg', '-i', input_path,
        '-ar', '16000',  # 16kHzサンプリング
        '-ac', '1',      # モノラル
        '-c:a', 'pcm_s16le',  # 16bit PCM
        '-y',            # 上書き
        output_path
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return output_path
    except:
        return input_path  # 変換失敗時は元ファイルを使用

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """ストリーミング進捗付き文字起こし"""
    print("[DEBUG] transcribe endpoint called", flush=True)

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

    def generate():
        try:
            # パラメータ取得
            model_name = request.form.get('model', 'small')
            language = request.form.get('language', 'ja')

            yield f"data: {json.dumps({'status': 'uploading', 'progress': 10, 'message': 'ファイルアップロード完了'})}\n\n"

            file_size_mb = os.path.getsize(filepath) / 1024 / 1024
            yield f"data: {json.dumps({'status': 'info', 'progress': 15, 'message': f'ファイルサイズ: {file_size_mb:.1f}MB'})}\n\n"

            start_time = time.time()

            # モデルロード
            yield f"data: {json.dumps({'status': 'loading_model', 'progress': 20, 'message': f'モデル {model_name} をロード中...'})}\n\n"
            model = load_model(model_name)
            yield f"data: {json.dumps({'status': 'model_loaded', 'progress': 30, 'message': 'モデルロード完了'})}\n\n"

            # 文字起こし開始
            yield f"data: {json.dumps({'status': 'transcribing', 'progress': 40, 'message': 'Whisper処理中...'})}\n\n"

            segments, info = model.transcribe(
                filepath,
                language=language if language != 'auto' else None,
                beam_size=1,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=1000),
                temperature=0.0,
                condition_on_previous_text=False,
                word_timestamps=False,
            )

            # セグメントをリアルタイム処理
            segments_list = []
            segment_count = 0
            for seg in segments:
                segments_list.append({'start': seg.start, 'end': seg.end, 'text': seg.text.strip()})
                segment_count += 1

                # 10セグメントごとに進捗更新
                if segment_count % 10 == 0:
                    progress = min(40 + (segment_count // 10) * 5, 90)
                    yield f"data: {json.dumps({'status': 'transcribing', 'progress': progress, 'message': f'処理中... ({segment_count}セグメント)'})}\n\n"

            processing_time = time.time() - start_time
            yield f"data: {json.dumps({'status': 'processing', 'progress': 95, 'message': 'ファイル生成中...'})}\n\n"

            # 結果をファイルに保存
            base_output = os.path.join(app.config['UPLOAD_FOLDER'], os.path.splitext(unique_filename)[0])
            full_text = "".join([segment['text'] for segment in segments_list])

            # テキストファイル保存
            txt_file = f"{base_output}.txt"
            with open(txt_file, 'w', encoding='utf-8') as f:
                f.write(full_text)

            # SRTファイル保存
            srt_file = f"{base_output}.srt"
            with open(srt_file, 'w', encoding='utf-8') as f:
                for i, segment in enumerate(segments_list, 1):
                    start = segment['start']
                    end = segment['end']
                    text = segment['text']

                    start_time = f"{int(start//3600):02d}:{int((start%3600)//60):02d}:{int(start%60):02d},{int((start%1)*1000):03d}"
                    end_time = f"{int(end//3600):02d}:{int((end%3600)//60):02d}:{int(end%60):02d},{int((end%1)*1000):03d}"

                    f.write(f"{i}\n{start_time} --> {end_time}\n{text}\n\n")

            # 音声ファイル削除
            if os.path.exists(filepath):
                os.remove(filepath)

            # 完了
            result = {
                'status': 'complete',
                'progress': 100,
                'message': '文字起こし完了',
                'text': full_text,
                'txt_file': os.path.basename(txt_file),
                'srt_file': os.path.basename(srt_file),
                'processing_time': f"{processing_time:.1f}秒",
                'language_detected': info.language if info else 'unknown'
            }
            yield f"data: {json.dumps(result)}\n\n"

        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"[ERROR] {error_detail}", flush=True)
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/download/<filename>')
def download(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return jsonify({'error': 'ファイルが見つかりません'}), 404

@app.route('/preload', methods=['POST'])
def preload():
    """モデルを事前ロード（初回起動時の高速化）"""
    model_name = request.json.get('model', 'medium')
    try:
        load_model(model_name)
        return jsonify({'success': True, 'message': f'モデル {model_name} をプリロードしました'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # 起動メッセージ
    # GPU検出情報を表示
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        mps_available = hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
    except:
        gpu_available = False
        mps_available = False

    print("=" * 60)
    print("【faster-whisper 超高速版】Whisper文字起こしWebアプリ")
    print("=" * 60)
    print("【超高速モード設定】")
    print("- モデル: small（デフォルト、速度と精度の最適バランス）")
    print("- beam_size: 1（最速設定）")
    print("- VADフィルタ: 有効（無音スキップ）")
    print("- 不要な処理: 全て削除")

    if gpu_available:
        print("- GPU: CUDA GPU検出 - 超高速処理モード")
        print("=" * 60)
        print("【期待される性能（GPU使用時）】")
        print("- 18分の音声: 約20-40秒")
        print("- 30分の音声: 約30-60秒")
        print("- 1時間の音声: 約60-120秒")
    elif mps_available:
        print("- GPU: Apple Silicon検出 - 最適化CPUモード")
        print("=" * 60)
        print("【期待される性能（Apple Silicon）】")
        print("- 18分の音声: 約60-90秒")
        print("- 30分の音声: 約100-150秒")
    else:
        print("- GPU: 未検出 - CPUモード")
        print("  ⚠️ GPU使用を強く推奨（処理速度が10倍以上向上）")
        print("=" * 60)
        print("【期待される性能（CPU）】")
        print("- 18分の音声: 約3-5分")
        print("- 30分の音声: 約5-8分")

    print("=" * 60)
    print("準備完了！ブラウザで以下のURLにアクセスしてください：")
    print("http://localhost:8081")
    print("=" * 60)

    app.run(debug=True, host='0.0.0.0', port=8081)
