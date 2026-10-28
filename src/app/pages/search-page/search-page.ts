import { Component } from '@angular/core';
import { ProfileCard } from '../../common-ui/profile-card/profile-card';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [ProfileCard],
  template: `
    <h1 style="margin-bottom: 24px; font-size: 24px;">Пошук</h1>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <app-profile-card></app-profile-card>
    </div>
  `,
  styles: ``
})
export class SearchPage {}
