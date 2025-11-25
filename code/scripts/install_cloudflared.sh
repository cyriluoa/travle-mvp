# Add cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null

# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# install cloudflared
sudo apt-get update && sudo apt-get install cloudflared

sudo cloudflared service install eyJhIjoiN2E5YzZkMzQ0ZjBlOWU2ZTJhYmRkYzE3MjUzYzVmZGMiLCJ0IjoiMDllN2JkZWEtYTJjMS00ODExLWExZTEtMjRkNjA2MmMwMjVhIiwicyI6IlpUSTJOalk0WXpVdE5UWTJZUzAwTnpNMExUbGhOMk10TVRCak16RXpPV1UwWm1NdyJ9
echo "=== Cloudflare connector installed ==="
echo "Now run: sudo systemctl enable cloudflared && sudo systemctl start cloudflared"