document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelectorAll(".nav a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
  }
});

window.addEventListener("load", () => {
  const iframe = document.querySelector(".map-frame");
  if (!iframe) return;

  iframe.addEventListener("load", () => {
    try {
      const w = iframe.contentWindow;
      const d = iframe.contentDocument;

      const injected = d.createElement("script");
      injected.type = "text/javascript";
      injected.text = `
        (function(){
          function onReady(cb){
            if (document.readyState !== 'loading') cb();
            else document.addEventListener('DOMContentLoaded', cb);
          }
          function debounce(fn, ms){ var t; return function(){ clearTimeout(t); var a=arguments, s=this; t=setTimeout(function(){ fn.apply(s,a); }, ms); }; }
          function getBoundsSafe(layer){
            try{
              if (!layer) return null;
              if (typeof layer.getBounds === 'function'){
                var b = layer.getBounds();
                if (b && typeof b.isValid === 'function' && b.isValid()) return b;
              }
              if (typeof layer.getLatLng === 'function'){
                var ll = layer.getLatLng();
                return L.latLngBounds(ll, ll);
              }
              if (typeof layer.eachLayer === 'function'){
                var bounds = null;
                layer.eachLayer(function(ch){
                  var cb = getBoundsSafe(ch);
                  if (cb) bounds = bounds ? bounds.extend(cb) : cb;
                });
                return bounds;
              }
              return null;
            }catch(e){ return null; }
          }
          onReady(function setup(){
            if (!window.map || !window.L){ return setTimeout(setup, 150); }

            var pending = false;
            // Tanda kalau user mengubah dari panel layer (tree/checkbox) atau SingleLayerControl custom
            document.addEventListener('change', function(ev){
              var el = ev.target;
              if (!el) return;
              if (el.closest('.leaflet-control-layers') || el.closest('.singlelayer-control')){
                pending = true;
              }
            });

            var fitOnce = debounce(function(layer){
              var b = getBoundsSafe(layer);
              if (!b) return;
              try { map.fitBounds(b.pad(0.10), { maxZoom: 16 }); }
              catch(_) { map.fitBounds(b); }
            }, 180);

            // Zoom hanya setelah interaksi user memicu penambahan layer
            map.on('layeradd', function(ev){
              if (!pending) return;
              pending = false;
              var lyr = ev.layer;
              if (lyr instanceof L.TileLayer) return; // abaikan basemap
              fitOnce(lyr);
            });
          });
        })();
      `;
      d.head.appendChild(injected);
    } catch (err) {

      console.warn("Zoom-on-layer injection skipped:", err);
    }
  });
});