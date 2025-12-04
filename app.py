from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import io
import zipfile
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def split_image(image_file):
  
    img = Image.open(image_file)
    width, height = img.size
    
    # Set how many pages are in the image
    part_width = 1080
    num_parts = (width + part_width - 1) // part_width 
    
    # Buffer memory for the zip file
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for i in range(num_parts):
            # setting crop
            left = i * part_width
            right = min((i + 1) * part_width, width)
            
            # crop the image
            cropped = img.crop((left, 0, right, height))
            
            # save on memory
            img_buffer = io.BytesIO()
            img_format = img.format if img.format else 'PNG'
            cropped.save(img_buffer, format=img_format)
            img_buffer.seek(0)
            
            # put on zip
            filename = f"{i+1:02d}.{img_format.lower()}"
            zip_file.writestr(filename, img_buffer.getvalue())
    
    zip_buffer.seek(0)
    return zip_buffer, num_parts

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/split', methods=['POST'])
def split():
    if 'image' not in request.files:
        return jsonify({'error': 'Image not send'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'Image not selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Format image has not supported'}), 400
    
    try:
        zip_buffer, num_parts = split_image(file)
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name= file.filename[:-4] + '-splited' + '.zip'
        )
    except Exception as e:
        return jsonify({'error': f'Error when process the image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3100)