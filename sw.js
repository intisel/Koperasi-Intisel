self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>self.clients.claim());
self.addEventListener('push',e=>{
  const d=e.data?e.data.text():'Status pinjaman Koperasi Intisel diperbarui';
  e.waitUntil(self.registration.showNotification('Koperasi Intisel',{body:d,icon:'https://cdn-icons-png.flaticon.com/512/2830/2830284.png'}));
});
