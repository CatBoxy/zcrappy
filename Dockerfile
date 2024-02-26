FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv \
    && python3 -m venv /venv

ENV PATH="/venv/bin:$PATH"

COPY requirements.txt .

RUN pip3 install --no-cache-dir -r requirements.txt

# Install Chrome
RUN apt-get install -y wget gnupg2
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
RUN apt-get update && apt-get install -y google-chrome-stable

# Install ChromeDriver
RUN CHROMEDRIVER_VERSION=122.0.6261.69 && \
    wget -N https://storage.googleapis.com/chrome-for-testing-public/$CHROMEDRIVER_VERSION/linux64/chromedriver-linux64.zip -P ~/ && \
    unzip ~/chromedriver-linux64.zip -d ~/ && \
    rm ~/chromedriver-linux64.zip && \
    mv -f ~/chromedriver-linux64 /usr/local/bin/chromedriver && \
    chown root:root /usr/local/bin/chromedriver && \
    chmod 0755 /usr/local/bin/chromedriver

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "dev" ]