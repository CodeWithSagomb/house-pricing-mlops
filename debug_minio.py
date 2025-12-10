import boto3
from botocore.client import Config

s3 = boto3.client('s3',
                    endpoint_url='http://localhost:9000',
                    aws_access_key_id='minio_admin',
                    aws_secret_access_key='minio_password',
                    config=Config(signature_version='s3v4'),
                    verify=False # Pas de SSL
                  )

print("Tentative de connexion à MinIO...")
try:
    response = s3.list_buckets()
    print("✅ Connexion Réussie ! Buckets trouvés :")
    for bucket in response['Buckets']:
        print(f" - {bucket['Name']}")
except Exception as e:
    print(f"❌ Erreur de connexion : {e}")