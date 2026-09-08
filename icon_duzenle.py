from PIL import Image

# Mevcut görseli aç
img = Image.open('icon.png').convert('RGBA')

# En ve boydan büyük olanı alarak kare bir tuval oluştur
width, height = img.size
max_dim = max(width, height)
new_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))

# Görseli tam ortaya yerleştir
offset = ((max_dim - width) // 2, (max_dim - height) // 2)
new_img.paste(img, offset)

# 128x128 boyutuna yeniden boyutlandır ve kaydet
icon_resized = new_img.resize((128, 128), Image.Resampling.LANCZOS)
icon_resized.save('icon.png', 'PNG')
print("✅ İkon başarıyla kare formata getirildi!")