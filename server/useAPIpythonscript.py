import requests

def upload_image_and_generate_url(image_path):
    url = "https://gemserver.vercel.app/api/upload-image"

    # Open file safely
    with open(image_path, "rb") as image_file:
        files = {"image": image_file}  # Change "file" to "image"
        response = requests.post(url, files=files)

    # Check for a valid response
    if response.status_code != 200:
        print("❌ Failed to upload image:", response.text)
        return None
    
    data = response.json()

    # Extract the 'imageUrl' from the response JSON
    image_url = data.get("imageUrl")
    
    if not image_url:
        print("⚠️ No image URL found in response")
        return None

    # Generate the final URL with the image URL
    generated_url = f"https://gem-webapp-ui.vercel.app?image={image_url}"
    print(generated_url)
    return generated_url

# Example usage
if __name__ == "__main__":
    image_path = "/Users/rodynaamr/Downloads/pic.png"
    upload_image_and_generate_url(image_path)
