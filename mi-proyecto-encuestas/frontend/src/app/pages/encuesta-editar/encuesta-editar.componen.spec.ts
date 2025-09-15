import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestaEditarComponent } from './encuesta-editar.component';

describe('EncuestaEditarComponent', () => {
  let component: EncuestaEditarComponent;
  let fixture: ComponentFixture<EncuestaEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestaEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestaEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
