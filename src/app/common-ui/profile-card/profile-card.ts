import { Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocalProfile } from '../../data/local-profile';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-profile-card',
  styleUrl: './profile-card.scss',
  templateUrl: './profile-card.html',
})
export class ProfileCard {
  readonly profile = input.required<LocalProfile>();
  readonly messageRequested = output<string>();
}
