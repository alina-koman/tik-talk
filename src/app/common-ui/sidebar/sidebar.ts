import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  menuItems = [
    { label: 'Моя сторінка', link: '/profile/me' },
    { label: 'Чати', link: '/chats' },
    { label: 'Пошук', link: '/search' },
  ];

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
