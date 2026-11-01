/* Dispensasi Masa Tunggu (pengurus) + keterangan Disiplin Pembayaran (pengurus, pimpinan, dan anggota). */
const DS_LABEL = {MENUNGGU:'⏳ Menunggu keputusan', DISETUJUI:'✅ Disetujui', DITOLAK:'❌ Ditolak'};
const DISIPLIN_UI = {BAIK:['#16a34a','✅ Disiplin baik'], CUKUP:['#d97706','⚠️ Cukup, perlu ditingkatkan'], KURANG:['#dc2626','❗ Perlu perhatian'], BELUM_DINILAI:['#6b7280','Belum ada angsuran yang dinilai'], BELUM_ADA:['#6b7280','Belum ada riwayat pinjaman']};
function disiplinHtml(dp, anggota){
  if(!dp) return '';
  const u = DISIPLIN_UI[dp.label] || DISIPLIN_UI.BELUM_ADA;
  return `<div style="border-left:4px solid ${u[0]};background:#f8fafc;border-radius:8px;padding:8px 10px;margin:8px 0">
    <div style="font-weight:800;color:${u[0]}">${u[1]}${dp.persenTepat !== null && dp.persenTepat !== undefined ? ' • ' + dp.persenTepat + '% tepat waktu' : ''}</div>
    <div class="small" style="margin-top:2px">${esc(dp.teks)}</div>
    ${anggota ? '<div class="small" style="margin-top:4px;color:#134e8a">Bayar angsuran tepat waktu agar koperasi tetap lancar dan anggota lain yang membutuhkan juga bisa terbantu. 🙏</div>' : ''}
  </div>`;
}
let dsFotoData = '', dsKandidat = [], dsPilihNik = '';
async function dsMuat(){
  const box = $('dsDaftar'); if(!box) return;
  try{
    const r = await pkApi({a:'ds_daftar', token:pkToken});
    if(r.expired){ pkExpired(); return; }
    if(!r.ok){ box.innerHTML = `<div class="err">${esc(r.msg)}</div>`; return; }
    pkBadge2('pbDispensasi', r.menunggu.filter(k => k.bisaPutus).length);
    $('dsFormBox').classList.toggle('hidden', !r.bisaAjukan);
    box.innerHTML = (r.menunggu.length ? r.menunggu.map(dsKartu).join('') : '<p class="small">Tidak ada usulan yang menunggu. ✅</p>') +
      (r.riwayat.length ? '<div style="font-weight:800;margin:14px 0 6px">Riwayat terakhir</div>' + r.riwayat.map(dsKartu).join('') : '');
    if(r.bisaAjukan){ dsKandidat = []; dsMuatKandidat(); }
  }catch(e){ box.innerHTML = '<div class="err">Gagal memuat data.</div>'; }
}
async function dsMuatKandidat(){
  try{ const r = await pkApi({a:'ds_kandidat', token:pkToken}); if(r.ok) dsKandidat = r.list; }catch(e){}
}
function dsKartu(k){
  const did = esc(k.did), nm = esc(k.nama).replace(/'/g, '');
  let st = '';
  if(k.status === 'DISETUJUI') st = k.dipakai ? ' — sudah dipakai (' + esc(k.dipakai) + ')' : k.aktif ? ' — berlaku sampai ' + tglf(k.berlaku) : ' — kedaluwarsa (tidak dipakai)';
  return `<div class="ok" style="background:#fff;margin-bottom:12px" id="ds-${did}">
    <b>${esc(k.nama)}</b> <span class="small">(NIK ${esc(k.nik)} • diusulkan ${esc(k.pengaju)} • ${esc(k.waktu)})</span><br>
    <span class="small">Lunas ${tglf(k.lunas)} • masa tunggu s.d. ${tglf(k.boleh)} • dilewati <b>${k.bulan} bulan</b> → limit dipotong <b>${pkRp(k.potongan)}</b></span><br>
    <span class="small">Alasan: <b>${esc(k.alasanTeks)}</b></span>
    <div class="small" style="white-space:pre-wrap;margin:6px 0;padding:8px;background:#f4f9ff;border-radius:8px">${esc(k.uraian)}</div>
    ${disiplinHtml(k.disiplin)}
    <a href="#" class="small" onclick="dsBukti('${did}');return false">📎 Lihat bukti pendukung</a><div id="dsb-${did}"></div>
    <div class="small" style="margin-top:6px"><b>Suara pengurus:</b> ${(k.suara || []).map(x => (x.v === 'Y' ? '✅' : x.v === 'N' ? '❌' : '⏳') + ' ' + esc(x.jabatan || x.nama) + (x.k ? ' <i>“' + esc(x.k) + '”</i>' : '')).join(' • ')}</div>
    ${k.status === 'MENUNGGU' ? (k.bisaPutus ? `
      <textarea id="dsK-${did}" rows="2" placeholder="Komentar (wajib bila menolak)" style="margin-top:8px"></textarea>
      <div style="display:flex;gap:8px"><button class="btn" style="background:#16a34a;padding:12px;font-size:14px" onclick="dsPutus('${did}','Y','${nm}')">✔ Setujui</button><button class="btn" style="background:#dc2626;padding:12px;font-size:14px" onclick="dsPutus('${did}','N','${nm}')">✖ Tolak</button></div>`
      : '<p class="small">Menunggu suara pengurus lain (Penasehat, Ketua, dan Bendahara harus setuju). Pimpinan diberi tahu setelah disetujui.</p>')
      : `<div class="small" style="margin-top:6px"><b>${DS_LABEL[k.status] || esc(k.status)}</b>${st} • ${esc(k.oleh)} • ${esc(k.waktuPutus)}${k.komentar ? '<br><i>“' + esc(k.komentar) + '”</i>' : ''}</div>`}
  </div>`;
}
async function dsBukti(did){
  const box = $('dsb-' + did); if(!box) return; box.innerHTML = '<span class="small">Memuat foto...</span>';
  try{
    const r = await pkApi({a:'ds_foto', token:pkToken, did});
    if(r.expired){ pkExpired(); return; }
    if(!r.ok){ box.innerHTML = `<div class="err">${esc(r.msg)}</div>`; return; }
    const img = document.createElement('img'); img.src = r.data; img.alt = 'Bukti pendukung';
    img.style.cssText = 'max-width:100%;border-radius:10px;margin-top:6px;border:1px solid #b9d2f0';
    box.innerHTML = ''; box.appendChild(img);
  }catch(e){ box.innerHTML = '<div class="err">Gagal memuat foto.</div>'; }
}
function dsCariIsi(){
  dsPilihNik = ''; $('dsInfo').style.display = 'none';
  const q = ($('dsCari').value || '').trim().toLowerCase(), box = $('dsSaran');
  if(!q){ box.innerHTML = ''; return; }
  const hit = dsKandidat.filter(p => String(p.nama).toLowerCase().indexOf(q) >= 0 || String(p.nik).indexOf(q) >= 0).slice(0, 8);
  box.innerHTML = hit.length ? hit.map(p => `<div class="small" style="padding:10px;border:1px solid #b9d2f0;border-radius:8px;margin:4px 0;background:#fff;cursor:pointer" onclick="dsPilih('${esc(p.nik)}')"><b>${esc(p.nama)}</b> • NIK ${esc(p.nik)}<br>Lunas ${tglf(p.lunas)} • masa tunggu s.d. ${tglf(p.boleh)}</div>`).join('') : '<p class="small">Tidak ada anggota dalam masa tunggu yang memenuhi syarat dengan nama itu.</p>';
}
function dsPilih(nik){
  const x = dsKandidat.filter(p => p.nik === nik)[0]; if(!x) return;
  dsPilihNik = nik; $('dsCari').value = x.nama; $('dsSaran').innerHTML = '';
  const b = $('dsInfo'); b.style.display = 'block';
  b.innerHTML = `<b>${esc(x.nama)}</b> (NIK ${esc(x.nik)})<br><span class="small">Pinjaman terakhir lunas ${tglf(x.lunas)} • masa tunggu berakhir ${tglf(x.boleh)}</span>
    <div style="margin-top:6px">Masa tunggu dilewati: <b>${x.bulan} bulan</b> × ${pkRp(500000)} = <b style="color:#b91c1c">potongan ${pkRp(x.potongan)}</b></div>
    <div style="font-size:16px;font-weight:800;margin-top:2px">Limit: ${pkRp(x.limitAsli)} → <span style="color:#16a34a">${pkRp(x.limitBaru)}</span> <span class="small">(tenor maks ${x.maxTenor} bln)</span></div>
    ${disiplinHtml(x.disiplin)}<div class="small">Berlaku 14 hari sejak disetujui dan hanya sekali pakai. Angka bulan dihitung ulang saat disetujui.</div>`;
}
function dsPilihFoto(inp){
  const f = inp.files && inp.files[0]; dsFotoData = ''; if(!f) return;
  const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => {
    const m = 1400, s = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); dsFotoData = c.toDataURL('image/jpeg', 0.8); $('dsFotoInfo').innerText = '✔ Foto terpilih'; }; im.src = rd.result; }; rd.readAsDataURL(f);
}
async function dsAjukan(){
  if(!dsPilihNik){ alert('Pilih anggota terlebih dahulu.'); return; }
  const x = dsKandidat.filter(p => p.nik === dsPilihNik)[0] || {};
  if(!await dialogKonfirmasi('Usulkan dispensasi masa tunggu untuk ' + (x.nama || '') + '?\n\nLimit dipotong ' + pkRp(x.potongan) + '. Berlaku bila ketiga pengurus menyetujui.')) return;
  const b = $('dsKirim'); b.disabled = true;
  try{
    const r = await pkApi({a:'ds_ajukan', token:pkToken, nik:dsPilihNik, alasan:$('dsAlasan').value, uraian:$('dsUraian').value, foto:dsFotoData});
    if(r.expired){ pkExpired(); return; }
    alert(r.ok ? r.msg : '❌ ' + r.msg);
    if(r.ok){ $('dsUraian').value = ''; $('dsCari').value = ''; dsPilihNik = ''; dsFotoData = ''; $('dsFotoInfo').innerText = ''; $('dsInfo').style.display = 'none'; }
  }catch(e){ alert('Gagal terhubung ke server.'); }
  b.disabled = false; dsMuat();
}
async function dsPutus(did, v, nama){
  const kom = ($('dsK-' + did).value || '').trim();
  if(v === 'N' && !kom){ alert('Alasan penolakan wajib diisi.'); return; }
  if(!await dialogKonfirmasi((v === 'Y' ? 'Setujui dispensasi masa tunggu untuk ' + nama + '?' : 'Tolak dispensasi masa tunggu untuk ' + nama + '?') + '\n\nLanjutkan?')) return;
  document.querySelectorAll('#ds-' + did + ' button').forEach(b => b.disabled = true);
  try{
    const r = await pkApi({a:'ds_putus', token:pkToken, did, v, komentar:kom});
    if(r.expired){ pkExpired(); return; }
    alert(r.ok ? r.msg : '❌ ' + r.msg);
  }catch(e){ alert('Gagal terhubung ke server.'); }
  dsMuat();
}
/* --- sisi anggota --- */
function renderDisiplinAnggota(){
  const dp = dataSaya.disiplin, ds = dataSaya.dispensasi, b = $('mnDisiplin'), f = $('dispBox');
  const html = (dp && dp.pinjaman ? `<div style="font-weight:800;color:#134e8a">📊 Disiplin Pembayaran Anda</div>` + disiplinHtml(dp, true) : '');
  const info = ds ? `<div class="ok" style="margin:8px 0">🎟️ <b>Dispensasi masa tunggu aktif</b> sampai <b>${tglf(ds.berlaku)}</b> (sekali pakai). Limit Anda dipotong ${ds.bulan} bulan × Rp 500.000 = ${rpf(ds.potongan)} sehingga maksimal <b>${rpf(ds.maxNominal)}</b>.</div>` : '';
  if(b){ b.style.display = (info || html) ? 'block' : 'none'; b.innerHTML = info + html; }
  if(f) f.innerHTML = info + html;
}
