// ============================================
// CONFIGURACIÓN DE MOZZAFIATO PWA
// ============================================

const CONFIG = {
  // PEGA AQUÍ EL ID DE TU GOOGLE SHEET
  SPREADSHEET_ID: '112q72cLCA2W40oB76Xytju-Xq5PiFSbjN56OBxPBfWE',
  
  // URL del Web App desplegado de Google Apps Script
  // Lo obtendrás en el PASO 4
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzWhQwxhUrBvf3M5YA9-N8jDn0v2q3ulmI6A8kT9c_fSD162-VXfgEvtVyIVJ3IuF5LAQ/exec',
  
  // Configuración de sincronización
  SYNC_INTERVAL: 60000, // 60 segundos
  
  // Nombre de las hojas
  SHEETS: {
    CATALOGO: '📦 Catálogo',
    PRODUCCION: '🏭 Producción',
    VENTAS: '💰 Ventas',
    INVENTARIO: '📊 Inventario'
  }
};

// ============================================
// FUNCIONES DE CONEXIÓN CON GOOGLE SHEETS
// ============================================

class MozzafiatoAPI {
  
  constructor() {
    this.baseUrl = CONFIG.WEB_APP_URL;
  }
  
  // Verificar conexión
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}?action=test`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error de conexión:', error);
      return false;
    }
  }
  
  // Obtener catálogo de productos
  async getCatalogo() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getCatalogo`);
      const data = await response.json();
      return data.productos || [];
    } catch (error) {
      console.error('Error al obtener catálogo:', error);
      return [];
    }
  }
  
  // Obtener inventario
  async getInventario() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getInventario`);
      const data = await response.json();
      return data.inventario || [];
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      return [];
    }
  }
  
  // Guardar producción
  async guardarProduccion(registros) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'guardarProduccion',
          registros: registros
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al guardar producción:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Guardar ventas
  async guardarVentas(registros) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'guardarVentas',
          registros: registros
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al guardar ventas:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener estadísticas del dashboard
  async getEstadisticas() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getEstadisticas`);
      const data = await response.json();
      return data.stats || null;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }
  
  // Obtener reportes
  async getReportes() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getReportes`);
      const data = await response.json();
      return data.reportes || null;
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      return null;
    }
  }
}

// Instancia global de la API
const api = new MozzafiatoAPI();

// ============================================
// FUNCIONES DE SINCRONIZACIÓN
// ============================================

// Sincronizar datos pendientes
async function sincronizarDatosPendientes() {
  console.log('🔄 Sincronizando datos pendientes...');
  
  // Verificar conexión
  if (!navigator.onLine) {
    console.log('📵 Sin conexión, sincronización pospuesta');
    return false;
  }
  
  try {
    // Sincronizar producción pendiente
    const produccionPendiente = JSON.parse(localStorage.getItem('produccion_guardada')) || [];
    if (produccionPendiente.length > 0) {
      const result = await api.guardarProduccion(produccionPendiente);
      if (result.success) {
        localStorage.removeItem('produccion_guardada');
        console.log('✅ Producción sincronizada:', produccionPendiente.length, 'registros');
      }
    }
    
    // Sincronizar ventas pendientes
    const ventasPendientes = JSON.parse(localStorage.getItem('ventas_guardadas')) || [];
    if (ventasPendientes.length > 0) {
      const result = await api.guardarVentas(ventasPendientes);
      if (result.success) {
        localStorage.removeItem('ventas_guardadas');
        console.log('✅ Ventas sincronizadas:', ventasPendientes.length, 'registros');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return false;
  }
}

// Actualizar datos desde Google Sheets
async function actualizarDatosLocales() {
  if (!navigator.onLine) return;
  
  try {
    // Actualizar inventario
    const inventario = await api.getInventario();
    if (inventario.length > 0) {
      localStorage.setItem('inventario_cache', JSON.stringify(inventario));
    }
    
    // Actualizar estadísticas
    const stats = await api.getEstadisticas();
    if (stats) {
      localStorage.setItem('mozzafiato_stats', JSON.stringify(stats));
    }
    
    console.log('✅ Datos actualizados desde Google Sheets');
  } catch (error) {
    console.error('Error al actualizar datos:', error);
  }
}

// Sincronización automática cada minuto
setInterval(() => {
  sincronizarDatosPendientes();
  actualizarDatosLocales();
}, CONFIG.SYNC_INTERVAL);

// Sincronizar cuando se recupera la conexión
window.addEventListener('online', () => {
  console.log('🌐 Conexión restaurada, sincronizando...');
  sincronizarDatosPendientes();
  actualizarDatosLocales();
});

// Sincronizar al cargar la página
if (navigator.onLine) {
  sincronizarDatosPendientes();
  actualizarDatosLocales();
}
