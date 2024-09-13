# Prisma RDS Data API
This project is used to deploy aurora serverless v2 clusters and to demonstrate the use of the newly created [Prisma Adapter Aurora](https://github.com/rayk47/prisma-adapter-aurora) which used the RDS Data API to communicate with Aurora. 

## Install NPM project 
```
npm install
```

## Env Variables
A sample env file has been provided [.env.sample](./.env.sample). Copy this file to `.env` and update the variables to your information.

```
cp ./.env.sample ./.env
```

## Login to your AWS Account on your terminal
You can do this in multiple ways. If you would like you can create an aws profile in your terminal and use that. You can also grab access keys for your account and set them in the terminal env variables such as: 
```
export AWS_ACCESS_KEY_ID="TESTSTESTLS53"
export AWS_SECRET_ACCESS_KEY="TESTOCEPBXp7TESTYhbdqO7i02VqEc9Uc4"
export AWS_SESSION_TOKEN="TestTestTestIQCky+Wr3rYHhMop8QuiGyP6bWpqPmNAnXzDLRSr1QIAhwIgbEkM3Hkw9R6FtzxILqX+5cNgXvkrzjV77UEQ4LHHe38qigMIxP//////////ARAAGgwwNTgyNjQyMTMwNjYiDMbS6zi74rxvCwT1gireAhgNgrc6UzqRF7VcjqH8wlv4n/JtjOLD85ZHl/fUVbxnfvp3pMPQV0ZaHNRJgXwpDMDPXn/n/T1LU/xJu1Zw3Qmx4WrLz81hxPdKi6pPBvihwkJTDeVRg0CsCCMqCIFdJzKHGlC67UiYFM77YgQ3TDSJmBMBpOe+iNZSEywxLMpek+P7w6xfwlx0MKseRJU9FrQbZsdfyrTESTmp+2FBwueH1fvmSt9SpdX3AINrwOD6FLOA/KQH1WMP5W1iGlOtyAR4Xv7WNZ2kOursCJG5DZhBcyHI8BGGhN/wEitfo7RXXD91an6V48CGFjr6QlK0ZZs1m//CtkWwes2gQAQCEf/QSajd/dAHdJsjQArC8h91IpYB7DW9mqTXlF7l7KLCOHOrX2rq7sKmVLiAUbCT71HyrIByxOPVlHJAFuqXrlXmN6N5AJwZwuiCCuQ8pOiepUKErAg6M+BtgMIaf7LMGOqYB5tcz4P1E3kVqe0PWTfvd4NftehuOdNN7/lawzq8IuxevlR97kz2kQW7GTWXQCLF1XwROThsIJ/abH8INbfxhG8kpXmaPF2tg/22dCEJ1XyCryO6JYLRqjILlhb9xBYhSPGLy8N4yH3RLsIA6sa7nqkgwQIHVAgP7wOEV6vIxPSdIPIueXEZXbROKxdyfnv4zW0CbssQzc0+hoxpljXIVgeDZS3TRxw=="
```

## Bootstrap
Make sure you first bootstrap your cdk before deploying

```
npm run bootstrap  
```

## Deploy
To deploy everything run

```
npm run deploy  
```

## Deploy Lambdas
To deploy only the lambdas run

```
npm run deploy-lambdas
```
