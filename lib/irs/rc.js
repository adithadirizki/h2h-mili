module.exports = [
    {
        pattern: " BERHASIL",
        rc: '00'
    },
    {
        pattern: "SUKSES",
        rc: '00'
    },
    {
        pattern: " under process",
        rc: '68'
    },
    {
        pattern: " under proses",
        rc: '68'
    },
    {
        pattern: " sedang dalam antrian",
        rc: '68'
    },
    {
        pattern: " sdg dalam antrian",
        rc: '68'
    },
    {
        pattern: " sedang diproses",
        rc: '68'
    },
    {
        pattern: " sdg diproses",
        rc: '68'
    },
    {
        pattern: " nomor tujuan dan produk tidak sesuai",
        rc: '14',
        flags: 'i'
    },
    {
        pattern: " tujuan salah",
        rc: '14'
    },
    {
        pattern: "Nomor tidak valid",
        rc: '14'
    },
    {
        pattern: "Maaf Produk sedang gangguan",
        rc: '90',
        flags: 'i'
    },
    {
        pattern: "Maaf.*Sedang gangguan. Coba ulangi beberapa saat lagi",
        rc: '90',
        flags: 'i'
    },
    {
        pattern: " RC:61 ",
        rc: '90'
    },
    {
        pattern: "GAGAL",
        rc: '40'
    }
]
