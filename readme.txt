Command to generate certificates:
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

Generate without passphrase:
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes



