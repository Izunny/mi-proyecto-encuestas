import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestaAgregarComponent } from './encuesta-agregar.component';

describe('EncuestaAgregarComponent', () => {
  let component: EncuestaAgregarComponent;
  let fixture: ComponentFixture<EncuestaAgregarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestaAgregarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestaAgregarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
