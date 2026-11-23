import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KafkaAdminService, CreateKafkaTopicRequest } from '../../core/kafka-admin.service';
import { environment } from '../../../environments/environment';

interface TopicViewItem {
  name: string;
  partitions: number | string;
  replicationFactor: number | string;
  retentionMs: string;
}

@Component({
  selector: 'app-kafka-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div>
          <h1>Administración de Kafka</h1>
          <p class="subtitle">Gestión de tópicos, particiones, factor de replicación y retención del clúster.</p>
        </div>

        <div class="header-actions">
          @if (!isProduction) {
            <a href="http://localhost:8090" target="_blank" rel="noopener" class="btn-outline">
              Abrir Kafka-UI
            </a>
          }
          <button type="button" class="btn-primary-cta" (click)="abrirModal()">
            + Crear tópico
          </button>
        </div>
      </div>

      @if (mensajeOk) {
        <div class="banner banner-ok">
          <span>{{ mensajeOk }}</span>
          <button type="button" class="banner-close" (click)="mensajeOk = ''">&times;</button>
        </div>
      }

      @if (mensajeError && !modalAbierto) {
        <div class="banner banner-err">
          <span>{{ mensajeError }}</span>
          <button type="button" class="banner-close" (click)="mensajeError = ''">&times;</button>
        </div>
      }

      <div class="card">
        <div class="card-top">
          <div class="card-title-group">
            <h2>Tópicos del clúster</h2>
            <span class="count-pill">{{ topics.length }} activos</span>
          </div>
          <button type="button" class="btn-outline" (click)="cargarTopicos()">Actualizar</button>
        </div>

        <table class="topics-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Particiones</th>
              <th>Factor de Replicación</th>
              <th>Retención</th>
              <th class="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (t of topics; track t.name) {
              <tr>
                <td><span class="topic-badge">{{ t.name }}</span></td>
                <td>{{ t.partitions }}</td>
                <td>{{ t.replicationFactor }}</td>
                <td>{{ t.retentionMs }}</td>
                <td class="col-actions">
                  <button
                    type="button"
                    class="btn-delete"
                    [disabled]="esTopicoProtegido(t.name)"
                    [title]="esTopicoProtegido(t.name) ? 'Tópico reservado del sistema' : 'Eliminar tópico'"
                    (click)="eliminarTopico(t.name)">
                    Eliminar
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty-row">No se encontraron tópicos en el clúster.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (modalAbierto) {
      <div class="modal-backdrop" (click)="cerrarModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Crear nuevo tópico</h3>
              <p>Configura el particionado, replicación y tiempo de retención en el clúster.</p>
            </div>
            <button type="button" class="modal-close" (click)="cerrarModal()">&times;</button>
          </div>

          <form (ngSubmit)="crearTopico()" class="modal-body">
            <div class="form-group">
              <label for="topicName">Nombre del tópico</label>
              <input
                id="topicName"
                type="text"
                [(ngModel)]="form.name"
                name="name"
                placeholder="ej. orders.retry"
                autocomplete="off"
                required />
              <span class="field-hint">Usa minúsculas, puntos o guiones sin espacios.</span>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="partitions">Particiones</label>
                <div class="stepper">
                  <button
                    type="button"
                    class="stepper-btn"
                    [disabled]="form.partitions <= 1"
                    (click)="cambiarParticiones(-1)">
                    &minus;
                  </button>
                  <input
                    id="partitions"
                    type="number"
                    class="stepper-input"
                    [(ngModel)]="form.partitions"
                    (blur)="normalizarValores()"
                    name="partitions"
                    min="1"
                    max="12"
                    required />
                  <button
                    type="button"
                    class="stepper-btn"
                    [disabled]="form.partitions >= 12"
                    (click)="cambiarParticiones(1)">
                    +
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="replication">Factor de replicación</label>
                <div class="stepper">
                  <button
                    type="button"
                    class="stepper-btn"
                    [disabled]="form.replicationFactor <= 1"
                    (click)="cambiarReplicas(-1)">
                    &minus;
                  </button>
                  <input
                    id="replication"
                    type="number"
                    class="stepper-input"
                    [(ngModel)]="form.replicationFactor"
                    (blur)="normalizarValores()"
                    name="replicationFactor"
                    min="1"
                    max="3"
                    required />
                  <button
                    type="button"
                    class="stepper-btn"
                    [disabled]="form.replicationFactor >= 3"
                    (click)="cambiarReplicas(1)">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="retention">Retención (ms)</label>
              <input
                id="retention"
                type="number"
                [(ngModel)]="form.retentionMs"
                name="retentionMs"
                min="60000"
                required />
              <div class="preset-row">
                <button
                  type="button"
                  class="preset-chip"
                  [class.preset-active]="form.retentionMs === 3600000"
                  (click)="form.retentionMs = 3600000">
                  1 hora
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  [class.preset-active]="form.retentionMs === 86400000"
                  (click)="form.retentionMs = 86400000">
                  24 horas
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  [class.preset-active]="form.retentionMs === 604800000"
                  (click)="form.retentionMs = 604800000">
                  7 días
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  [class.preset-active]="form.retentionMs === 2592000000"
                  (click)="form.retentionMs = 2592000000">
                  30 días
                </button>
              </div>
            </div>

            @if (mensajeError) {
              <div class="modal-error">{{ mensajeError }}</div>
            }

            <div class="modal-footer">
              <button type="button" class="btn-outline" (click)="cerrarModal()" [disabled]="guardando">
                Cancelar
              </button>
              <button type="submit" class="btn-primary-cta" [disabled]="guardando || !form.name.trim()">
                {{ guardando ? 'Creando tópico...' : 'Crear tópico' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 24px 32px; color: #0f172a; }
    .page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; }
    h1 { font-size: 26px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a; }
    .subtitle { font-size: 14px; color: #64748b; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 10px; }

    .btn-primary-cta {
      background: #1d4ed8;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(29, 78, 216, 0.25);
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .btn-primary-cta:hover:not(:disabled) { background: #1e40af; }
    .btn-primary-cta:active:not(:disabled) { transform: translateY(1px); }
    .btn-primary-cta:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-outline {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .btn-outline:hover:not(:disabled) { background: #f8fafc; }

    .banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .banner-ok { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .banner-err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .banner-close { background: none; border: none; font-size: 18px; line-height: 1; cursor: pointer; color: inherit; opacity: 0.75; }

    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title-group { display: flex; align-items: center; gap: 10px; }
    h2 { font-size: 16px; font-weight: 600; margin: 0; }
    .count-pill { font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eff6ff; padding: 3px 10px; border-radius: 999px; }

    .topics-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .topics-table th { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; }
    .topics-table td { padding: 13px 12px; border-bottom: 1px solid #f1f5f9; }
    .topics-table tbody tr:hover { background: #f8fafc; }
    .col-actions { text-align: right; }
    .topic-badge { font-family: monospace; font-weight: 600; font-size: 13px; color: #0f172a; background: #f1f5f9; padding: 4px 9px; border-radius: 6px; }

    .btn-delete { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-delete:hover:not(:disabled) { background: #fee2e2; }
    .btn-delete:disabled { opacity: 0.35; cursor: not-allowed; }
    .empty-row { text-align: center; color: #64748b; padding: 28px; }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 1000;
    }
    .modal-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 16px 24px;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-header h3 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; color: #0f172a; }
    .modal-header p { font-size: 13px; color: #64748b; margin: 0; }
    .modal-close { background: none; border: none; font-size: 22px; line-height: 1; color: #64748b; cursor: pointer; padding: 0 4px; }
    .modal-close:hover { color: #0f172a; }

    .modal-body { padding: 20px 24px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #334155; }
    .form-group > input { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #0f172a; }
    .form-group > input:focus { outline: none; border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12); }
    .field-hint { font-size: 12px; color: #64748b; }

    .stepper {
      display: flex;
      align-items: stretch;
      height: 42px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
    }
    .stepper:focus-within {
      border-color: #1d4ed8;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
    }
    .stepper-btn {
      width: 44px;
      background: #f8fafc;
      border: none;
      color: #0f172a;
      font-size: 20px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      transition: background-color 0.15s ease;
    }
    .stepper-btn:hover:not(:disabled) { background: #e2e8f0; }
    .stepper-btn:active:not(:disabled) { background: #cbd5e1; }
    .stepper-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .stepper-input {
      flex: 1;
      width: 100%;
      min-width: 0;
      border: none;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      text-align: center;
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      padding: 0 6px;
      -moz-appearance: textfield;
    }
    .stepper-input:focus { outline: none; }

    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type="number"] {
      -moz-appearance: textfield;
    }

    .preset-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
    .preset-chip {
      background: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    .preset-chip:hover { background: #f1f5f9; }
    .preset-active { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; font-weight: 600; }

    .modal-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; font-size: 13px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }
  `]
})
export class KafkaAdminComponent implements OnInit {
  private kafkaService = inject(KafkaAdminService);

  readonly isProduction = environment.production;
  topics: TopicViewItem[] = [];
  modalAbierto = false;
  guardando = false;
  mensajeOk = '';
  mensajeError = '';

  form: CreateKafkaTopicRequest = {
    name: '',
    partitions: 3,
    replicationFactor: 3,
    retentionMs: 604800000
  };

  ngOnInit(): void {
    this.cargarTopicos();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.modalAbierto && !this.guardando) {
      this.cerrarModal();
    }
  }

  abrirModal(): void {
    this.mensajeError = '';
    this.form = {
      name: '',
      partitions: 3,
      replicationFactor: 3,
      retentionMs: 604800000
    };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.mensajeError = '';
  }

  cambiarParticiones(delta: number): void {
    const actual = Number(this.form.partitions) || 1;
    this.form.partitions = Math.min(12, Math.max(1, actual + delta));
  }

  cambiarReplicas(delta: number): void {
    const actual = Number(this.form.replicationFactor) || 1;
    this.form.replicationFactor = Math.min(3, Math.max(1, actual + delta));
  }

  normalizarValores(): void {
    this.form.partitions = Math.min(12, Math.max(1, Number(this.form.partitions) || 1));
    this.form.replicationFactor = Math.min(3, Math.max(1, Number(this.form.replicationFactor) || 1));
  }

  cargarTopicos(): void {
    this.kafkaService.getTopics().subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : [];
        this.topics = list
          .map((item) => {
            if (typeof item === 'string') {
              return { name: item, partitions: 3, replicationFactor: 3, retentionMs: 'Configurada en broker' };
            }
            const partitionCount = Array.isArray(item.partitions)
              ? item.partitions.length
              : (item.partitions ?? item.partitionCount ?? 3);

            return {
              name: item.name || item.topicName || '',
              partitions: partitionCount,
              replicationFactor: item.replicationFactor ?? 3,
              retentionMs: item.retentionMs ? `${item.retentionMs} ms` : 'Configurada en broker'
            };
          })
          .filter((t) => t.name && !t.name.startsWith('__'));
        this.mensajeError = '';
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los tópicos de Kafka.';
      }
    });
  }

  crearTopico(): void {
    const nombreLimpio = this.form.name.trim();
    if (!nombreLimpio) return;

    this.normalizarValores();
    this.guardando = true;
    this.mensajeOk = '';
    this.mensajeError = '';

    this.kafkaService.createTopic({ ...this.form, name: nombreLimpio }).subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.mensajeOk = `Tópico "${nombreLimpio}" creado correctamente.`;
        this.cargarTopicos();
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = err?.error?.message || 'No se pudo crear el tópico.';
      }
    });
  }

  eliminarTopico(name: string): void {
    this.mensajeOk = '';
    this.mensajeError = '';
    this.kafkaService.deleteTopic(name).subscribe({
      next: () => {
        this.mensajeOk = `Tópico "${name}" eliminado.`;
        this.cargarTopicos();
      },
      error: () => {
        this.mensajeError = `Error al eliminar el tópico "${name}".`;
      }
    });
  }

  esTopicoProtegido(name: string): boolean {
    return name === 'orders.events' || name === 'audit.timeline' || name.endsWith('.DLT');
  }
}