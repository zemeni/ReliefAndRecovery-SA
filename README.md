# ReliefAndRecovery-SA
This is the relief an recovery admin portal

# Users sign up
You need to ask someone to make you active once signed up

# nginx setup
refer to nginx.tx to update content in sites-available
sudo systemctl enable nginx
sudo systemctl start nginx

sudo npm install pm2@latest -g
pm2 start server.js
pm2 stop server




# Deployment
Deployment is done manually

scp -i .\ReliefAndRecovery.pem .\ReliefAndRecoveryProjects\ReliefAndRecovery-SA\ReliefAndRecovery_19_09_2024.zip ubuntu@54.206.216.112:/home/ubuntu

ssh -i "ReliefAndRecovery.pem" ubuntu@ec2-54-206-216-112.ap-southeast-2.compute.amazonaws.com

mkdir ReliefAndRecovery
unzip ReliefAndRecovery.zip -> ReliefAndRecovery
npm i
pm2 stop server
pm2 start server.js


# connecting to DB is allowed only from EC2
use this command
psql -h reliefandrecoveryinstance.csyhttqbokec.ap-southeast-2.rds.amazonaws.com -d reliefandrecovery -U postgres
psql -h reliefandrecovery-prod.csyhttqbokec.ap-southeast-2.rds.amazonaws.com -d reliefandrecovery -U postgres



# Creating EC2 instances
Choosen Ubuntu Free tier
Instance type t2.micro
keyPair - in my local
Network settings 
- Allow SSH form my ip (143.216.105.208/32)
- Allow HTTPS traffic from internet
- Allow HTTP traffic from internet




