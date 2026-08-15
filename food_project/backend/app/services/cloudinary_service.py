import os
import cloudinary
import cloudinary.uploader
import cloudinary.api

def init_cloudinary():
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "snivwqcw")
    api_key = os.getenv("CLOUDINARY_API_KEY", "664379995118548")
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "-2HdOT9pV6-H4U1rsB_Dna_wR-s")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    print(f"[Cloudinary Service] Initialized successfully with cloud_name='{cloud_name}'!")

def upload_image_to_cloudinary(file_path_or_url: str, folder: str = "food_ai_app") -> str:
    init_cloudinary()
    try:
        response = cloudinary.uploader.upload(
            file_path_or_url,
            folder=folder,
            overwrite=True,
            resource_type="image"
        )
        return response.get("secure_url")
    except Exception as e:
        print(f"[Cloudinary Upload Error]: {e}")
        return None

if __name__ == "__main__":
    init_cloudinary()
