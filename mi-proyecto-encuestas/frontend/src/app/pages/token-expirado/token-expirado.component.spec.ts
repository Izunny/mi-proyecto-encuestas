import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenExpiradoComponent } from './token-expirado.component'; 

describe('TokenExpiradoComponent', () => {
  let component: TokenExpiradoComponent;
  let fixture: ComponentFixture<TokenExpiradoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenExpiradoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenExpiradoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
