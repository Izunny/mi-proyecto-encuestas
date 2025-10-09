import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html', 
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user$!: Observable<any | null>; 

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$; 
  }

  logout(): void {
    this.authService.logout();
  }
}
