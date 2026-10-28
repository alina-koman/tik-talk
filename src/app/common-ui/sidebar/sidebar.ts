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

  readonly menuItems = [
    { label: 'Моя сторінка', link: '/profile/me', icon: 'profile' },
    { label: 'Чати', link: '/chats', icon: 'chats' },
    { label: 'Пошук', link: '/search', icon: 'search' },
  ];

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
