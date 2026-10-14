import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  pedidos: any[] = [];
  productosDisponibles: any[] = [];
  
  isAdmin: boolean = false;
  isOperator: boolean = false;
  isCustomer: boolean = false;
  userEmail: string = '';

  mostrarFormulario: boolean = false;
  nuevoCliente: string = '';
  
  // Variables de filtros superiores
  filtroTexto: string = '';
  filtroEstado: string = '';
  filtroFecha: string = '';

  // Variables del Carrito y Cantidad
  productoSeleccionadoId: number | null = null;
  cantidadSeleccionada: number = 1;
  carrito: any[] = [];
  nuevoTotal: number = 0;
  
  notificacion: string | null = null;
  pedidoSeleccionado: any = null;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then(() => {
      this.verificarRolYUsuario();
      this.cargarPedidos();
      this.cargarProductos();
    });
  }

  verificarRolYUsuario() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      this.userEmail = account.username; 
      
      const claims: any = account.idTokenClaims;
      const roles = claims?.roles || []; 

      this.isAdmin = roles.includes('Administrador') || roles.includes('Admin');
      this.isOperator = roles.includes('Operador de Logística') || roles.includes('Operador');
      this.isCustomer = roles.includes('Cliente') || roles.includes('Customer') || (!this.isAdmin && !this.isOperator);
      
      if (this.isCustomer) {
        this.nuevoCliente = this.userEmail;
      }
    }
  }

  cargarPedidos() {
    let endpoint = `${environment.apiUrl}/orders`;
    
    if (this.isCustomer) {
      endpoint = `${environment.apiUrl}/orders/customer?email=${this.userEmail}`;
    } else if (this.isOperator) {
      endpoint = `${environment.apiUrl}/orders/pending`;
    }

    this.http.get<any[]>(endpoint).subscribe({
      next: (data) => this.pedidos = data || [],
      error: (err) => console.error('Error cargando pedidos:', err)
    });
  }

  cargarProductos() {
    this.http.get<any[]>(`${environment.apiUrl}/catalog/products`).subscribe({
      next: (data) => this.productosDisponibles = data || [],
      error: () => {
        this.http.get<any>(`${environment.apiUrl}/catalog`).subscribe({
          next: (res) => {
            if (Array.isArray(res)) this.productosDisponibles = res;
            else if (res && Array.isArray(res.content)) this.productosDisponibles = res.content;
            else this.productosDisponibles = [];
          },
          error: (err) => console.error('Error cargando catálogo:', err)
        });
      }
    });
  }

  // Getter para filtrar pedidos en tiempo real con los inputs superiores
  get pedidosFiltrados() {
    return this.pedidos.filter(p => {
      const idStr = String(p.id || '');
      const customer = (p.customerId || '').toLowerCase();
      const texto = this.filtroTexto.toLowerCase();
      
      const matchTexto = !this.filtroTexto || idStr.includes(texto) || customer.includes(texto);
      const matchEstado = !this.filtroEstado || p.status === this.filtroEstado;
      const matchFecha = !this.filtroFecha || (p.createdAt || '').includes(this.filtroFecha);

      return matchTexto && matchEstado && matchFecha;
    });
  }

  agregarAlCarrito() {
    if (!this.productoSeleccionadoId || this.cantidadSeleccionada < 1) return;
    
    const prod = this.productosDisponibles.find(p => p.id === Number(this.productoSeleccionadoId));
    if (prod) {
      const precio = prod.precio || prod.price || 0;
      const subtotal = precio * this.cantidadSeleccionada;
      
      this.carrito.push({
        productId: prod.id,
        nombre: prod.nombre || prod.name,
        precio: precio,
        quantity: this.cantidadSeleccionada,
        subtotal: subtotal
      });
      
      this.calcularTotal();
      this.productoSeleccionadoId = null;
      this.cantidadSeleccionada = 1;
    }
  }

  quitarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  cambiarCantidadItem(index: number, delta: number) {
    const item = this.carrito[index];
    item.quantity += delta;
    if (item.quantity < 1) {
      item.quantity = 1;
    }
    item.subtotal = item.precio * item.quantity;
    this.calcularTotal();
  }

  calcularTotal() {
    this.nuevoTotal = this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  guardarPedido() {
    if (!this.nuevoCliente || this.carrito.length === 0) {
      this.mostrarNotificacion('Agrega al menos un producto al carrito.');
      return;
    }

    const payload = {
      customerId: this.nuevoCliente.trim(),
      total: this.nuevoTotal,
      items: this.carrito.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.http.post(`${environment.apiUrl}/orders`, payload).subscribe({
      next: () => {
        this.cargarPedidos();
        this.mostrarNotificacion(`¡Orden procesada con éxito!`);
        
        if (!this.isCustomer) this.nuevoCliente = '';
        this.carrito = [];
        this.nuevoTotal = 0;
        this.mostrarFormulario = false;
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        this.mostrarNotificacion('Error al intentar crear el pedido en el servidor.');
      }
    });
  }

  cambiarEstado(id: number, nuevoEstado: string) {
    this.http.put(`${environment.apiUrl}/orders/${id}/status?nuevoEstado=${nuevoEstado}`, {}).subscribe({
      next: () => {
        this.cargarPedidos();
        this.mostrarNotificacion(`Pedido #${id} actualizado a ${nuevoEstado}.`);
      },
      error: (err) => {
        console.error('Error cambiando estado:', err);
        this.mostrarNotificacion('No se pudo cambiar el estado del pedido.');
      }
    });
  }

  iniciarPagoWebpay(orderId: number, totalStr: any) {
    // Aseguramos que el monto sea un número entero puro
    const montoNumerico = Math.round(Number(String(totalStr).replace(/[^0-9.-]+/g, "")));

    if (!montoNumerico || montoNumerico <= 0) {
      this.mostrarNotificacion('El monto del pedido no es válido.');
      return;
    }

    // Aseguramos la ruta exacta hacia el endpoint de pagos
    const endpoint = `${environment.apiUrl}/payments/create?amount=${montoNumerico}&orderId=${orderId}`;

    this.http.post<any>(endpoint, {}).subscribe({
      next: (response) => {
        if (response && response.url && response.token_ws) {
          this.redirigirATransbank(response.url, response.token_ws);
        } else {
          this.mostrarNotificacion('Transbank no devolvió el token de sesión.');
        }
      },
      error: (err) => {
        console.error('Error al iniciar Webpay:', err);
        this.mostrarNotificacion('Error de comunicación con el servicio de pagos.');
      }
    });
  }

  redirigirATransbank(url: string, token: string) {
    const form = document.createElement('form');
    form.action = url;
    form.method = 'POST';

    const inputToken = document.createElement('input');
    inputToken.type = 'hidden';
    inputToken.name = 'token_ws';
    inputToken.value = token;

    form.appendChild(inputToken);
    document.body.appendChild(form);
    form.submit();
  }

  mostrarNotificacion(mensaje: string) {
    this.notificacion = mensaje;
    setTimeout(() => {
      this.notificacion = null;
    }, 4000);
  }

  verDetalle(pedido: any) {
    this.pedidoSeleccionado = pedido;
  }

  cerrarDetalle() {
    this.pedidoSeleccionado = null;
  }

  obtenerNombreProducto(productId: number): string {
    const prod = this.productosDisponibles.find(p => p.id === productId);
    return prod ? (prod.nombre || prod.name || 'Producto Desconocido') : 'Producto Desconocido';
  }

  // Cálculos fiscales para la boleta chilena (IVA 19%)
  getNeto(total: number): number {
    return Math.round((total || 0) / 1.19);
  }

  getIva(total: number): number {
    return (total || 0) - this.getNeto(total);
  }

  // Imprimir documento directamente en impresora física
  imprimirBoleta() {
    const contenidoHtml = document.getElementById('area-boleta-fiscal')?.innerHTML;
    if (!contenidoHtml) return;

    const ventanaImpresion = window.open('', '', 'height=750,width=500');
    if (!ventanaImpresion) return;

    ventanaImpresion.document.write('<html><head><title>Boleta Electrónica - PEDIDOS360</title>');
    ventanaImpresion.document.write(`
      <style>
        body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; background: #fff; font-size: 13px; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th, td { text-align: left; padding: 4px 0; }
        th { border-bottom: 1px solid #000; }
      </style>
    `);
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenidoHtml);
    ventanaImpresion.document.write('</body></html>');
    ventanaImpresion.document.close();
    ventanaImpresion.focus();

    setTimeout(() => {
      ventanaImpresion.print();
      ventanaImpresion.close();
    }, 500);
  }

  // Descarga directa del archivo PDF usando html2pdf.js
  descargarPDF() {
    const elemento = document.getElementById('area-boleta-fiscal');
    if (!elemento) return;

    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        this.ejecutarHtml2Pdf(elemento);
      };
      document.head.appendChild(script);
    } else {
      this.ejecutarHtml2Pdf(elemento);
    }
  }

  private ejecutarHtml2Pdf(elemento: HTMLElement) {
    const opciones = {
      margin: 10,
      filename: `Boleta_PEDIDOS360_${this.pedidoSeleccionado?.id || 'Documento'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().from(elemento).set(opciones).save();
  }
}