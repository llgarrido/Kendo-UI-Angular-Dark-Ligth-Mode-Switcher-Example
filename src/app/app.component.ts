import { Component, OnInit } from '@angular/core';
import { products } from './products';
import { ThemeService } from './theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  data!: any[];

  constructor(private themeService: ThemeService) {
  }

  ngOnInit(): void {
    this.themeService.apply();
    this.data = products;
  }

  setDarkModeTheme()
  {
    this.themeService.setDarkMode();
  }

  setLightModeTheme()
  {
    this.themeService.setLightMode();
  }

  setSystemModeTheme()
  {
    this.themeService.setSystemMode();
  }
}
