import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAlert } from './modal-alert';

describe('ModalAlert', () => {
  let component: ModalAlert;
  let fixture: ComponentFixture<ModalAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAlert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAlert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
