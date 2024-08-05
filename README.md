# ReliefAndRecovery-SA
This is the relief an recovery admin portal

# Users sign up
You need to ask someone to make you active once signed up

# Deployment
Deployment is done manually

scp -i .\ReliefAndRecovery.pem .\ReliefAndRecoveryProjects\ReliefAndRecovery-SA\ReliefAndRecovery_05_08_2024.zip ubuntu@54.206.216.112:/home/ubuntu

ssh -i "ReliefAndRecovery.pem" ubuntu@ec2-54-206-216-112.ap-southeast-2.compute.amazonaws.com

mkdir ReliefAndRecovery
unzip ReliefAndRecovery.zip -> ReliefAndRecovery
npm i
pm2 stop server
pm2 start server.js




