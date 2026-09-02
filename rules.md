Tolong implementasikan pembaruan fitur transaksi dan penanganan status pembayaran dengan aturan bisnis berikut:

1. Validasi Transaksi Pending (Max 2 Pending Orders)
- Sebelum membuat transaksi baru ke Payment Gateway, lakukan pengecekan di database.
- Batasi setiap user hanya boleh memiliki maksimal 2 transaksi dengan status 'PENDING'.
- Jika user sudah memiliki 2 transaksi pending, tolak pembuatan transaksi baru dan berikan respon error/alert yang jelas agar user menyelesaikan atau membatalkan pesanan tertundanya terlebih dahulu.
- Tambahkan fitur/opsi "Batalkan Pesanan" bagi user di halaman riwayat transaksi untuk mengubah status pending menjadi 'CANCELLED'.
- Atur waktu kedaluwarsa (expiry duration) QRIS/transaksi menjadi 15 menit agar slot pending lekas terbuka kembali jika tidak dibayar.

2. Otomatisasi Fulfillment Token via Webhook
- Pembayaran tidak memerlukan persetujuan manual admin. 
- Begitu webhook notifikasi settlement diterima dan valid (terverifikasi signature key-nya), sistem harus langsung:
  a. Memperbarui status transaksi menjadi 'SUCCESS' / 'SETTLEMENT'.
  b. Menambahkan jumlah token langsung ke saldo/akun user secara otomatis (terapkan pengecekan idempotensi agar token tidak bertambah ganda jika webhook terkirim ulang).

3. Rincian Data Transaksi (User vs Admin View)
- Sisi User:
  Tampilkan riwayat transaksi yang mencakup Order ID, tanggal transaksi, nominal pembayaran, jumlah token yang didapat, metode pembayaran (QRIS), dan status pembayaran ('PENDING', 'SUCCESS', 'EXPIRED', 'CANCELLED').
- Sisi Admin:
  Buat panel/tabel transaksi yang lebih komprehensif untuk kebutuhan audit dan troubleshooting, meliputi:
  - User ID, Nama, dan Email user.
  - Order ID internal dan Transaction ID dari Payment Gateway.
  - Gross amount, potongan MDR, dan total bersih.
  - Status pembayaran beserta log timestamp waktu lunas dan penambahan token.
  - Tombol aksi untuk sinkronisasi/pengecekan status manual ke API Payment Gateway jika ada keterlambatan webhook.

Tolong implementasikan logic ini secara modular, rapi, dan tangani edge cases serta error handling-nya dengan baik.