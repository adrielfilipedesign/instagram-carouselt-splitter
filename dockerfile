# Imagem base oficial do Python 3.10 slim
FROM python:3.10-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia todo o conteúdo do projeto para o diretório de trabalho no container
COPY . /app

# Instala as dependências necessárias
RUN pip install --no-cache-dir flask pillow

# Expõe a porta 3100 para acesso externo
EXPOSE 3100

# Comando para iniciar a aplicação Flask
CMD ["python", "app.py", "--host=0.0.0.0", "--port=3100"]
