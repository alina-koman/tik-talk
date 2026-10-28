import { Routes } from '@angular/router';
import { Layout } from './common-ui/layout/layout';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'search', pathMatch: 'full' },
      { path: 'search', loadComponent: () => import('./pages/search-page/search-page').then(m => m.SearchPage) },
      { path: 'chats', loadComponent: () => import('./pages/chats-page/chats-page').then(m => m.ChatsPage) },
      { path: 'profile/me', loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage) },
      { path: 'profile/:id', loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage) },
    ]
  },
  { path: 'login', loadComponent: () => import('./pages/login-page/login-page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register-page/register-page').then(m => m.RegisterPage) },
];
