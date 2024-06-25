FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv \
    && python3 -m venv /venv

ENV PATH="/venv/bin:$PATH"

COPY requirements.txt .

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]