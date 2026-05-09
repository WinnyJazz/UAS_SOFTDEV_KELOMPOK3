// models/AspirasiHelper.js
// <<Value Object>> - bukan disimpan di DB, hanya struktur data helper
// Sesuai class diagram, ini adalah Value Object

class AspirasiHelper {
  constructor({
    jumlahAspirasiDiterima = 0,
    jumlahAspirasiDiproses = 0,
    jumlahAspirasiDitolak = 0,
    jumlahAspirasiDisetujui = 0,
  }) {
    this.jumlahAspirasiDiterima = jumlahAspirasiDiterima;
    this.jumlahAspirasiDiproses = jumlahAspirasiDiproses;
    this.jumlahAspirasiDitolak = jumlahAspirasiDitolak;
    this.jumlahAspirasiDisetujui = jumlahAspirasiDisetujui;
  }

  toJSON() {
    return {
      jumlahAspirasiDiterima: this.jumlahAspirasiDiterima,
      jumlahAspirasiDiproses: this.jumlahAspirasiDiproses,
      jumlahAspirasiDitolak: this.jumlahAspirasiDitolak,
      jumlahAspirasiDisetujui: this.jumlahAspirasiDisetujui,
    };
  }
}

module.exports = AspirasiHelper;