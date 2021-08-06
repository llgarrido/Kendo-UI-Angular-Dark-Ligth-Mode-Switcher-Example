import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeSettings } from './theme-settings';

/**
 *  User interface theme manager (dark or light).
 *
 *  It implements the default theme of the operating system.
 *
 *  This service can change the theme mode:
 *  - When requested by the user within the application.
 *  - When requested by the user from the theme configuration in the operating system.
 *
 *  If user chooses the theme mode from the web application its configuration is persisted in local storage.
 *
 * @export
 * @class ThemeService
 * @implements {OnDestroy}
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {

  /** The light mode background css class name to be attached to HTML Body element. */
  private static readonly LIGHT_MODE_CSS_CLASS_NAME : string = 'theme-alternate';

  /** Name of the local storage key value to query and persist the theme settings. */
  private static readonly SETTINGS_KEY: string = 'theme';

  /**
   * CSS media feature that is used to detect if the user has requested a light or dark color theme.
   * The user might indicate this preference through an operating system setting (e.g. light or dark mode).
   * */
  private static readonly SYSTEM_DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

  /** DOM renderer */
  private renderer: Renderer2;

  /** Settings for the visual appearance of the user interface. */
  private settings: ThemeSettings;

  private destructionSubject: Subject<void> | null = null;

  private _kendouiStylesheetHtmlElement?: HTMLLinkElement;

  /**
   * Load or create the Html element that should link the url of the stylesheet of the Kendo UI component theme.
   *
   * @readonly
   */
  get kendouiStylesheetHtmlElement() {
    if (!this._kendouiStylesheetHtmlElement)
    {
      this._kendouiStylesheetHtmlElement = this.renderer.createElement('link');
      this.renderer.setAttribute(this._kendouiStylesheetHtmlElement, 'rel', 'stylesheet');
      const headHtmlElement: HTMLHeadElement = this.document.getElementsByTagName('head')[0];
      this.renderer.appendChild(headHtmlElement, this._kendouiStylesheetHtmlElement)
    }
    return this._kendouiStylesheetHtmlElement;
  }

  /**
   * Serializes and sets the value of the pair identified by key to value in Local Storage, creating a new key/value pair if none existed for key previously.
   *
   * @param {string} key The name of the key you want to create/update.
   * @param {*} value The value you want to give the key you are creating/updating.
   * @private
   */
  private setLocalStorageItem(key: string, value: any): void
  {
    const serializedValue: string = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  }

  /**
  * Returns and deserializes the current value associated with the given key in Local Storage, or null if the given key
  *
  * @param {string} key The name of the key you want to retrieve the value of.
  * @returns {*} The value of the key. If the key does not exist, undefined is returned.
  * @private
  */
  private getLocalStorageItem(key: string): any
  {
    const serializedValue: string | null = localStorage.getItem(key);
    const result: any = (serializedValue) ? JSON.parse(serializedValue) : undefined;
    return result;
  }

  /**
   * Removes the key/value pair with the given key from the list associated with the object in Local Storage, if a key/value pair with the given key exists.
   *
   * @param {string} key The name of the key you want to remove.
   * @private
   */
  private removeLocalStorageItem(key: string)
  {
    localStorage.removeItem(key);
  }

  /**
   * Constructor.
   * @param {Document} document Web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree..
   * @param {RendererFactory2} rendererFactory Creates and initializes a custom renderer that implements the Renderer2 base class.
   */
  constructor(@Inject(DOCUMENT) private document: Document,
      rendererFactory: RendererFactory2)
  {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.settings = this.getLocalStorageItem(ThemeService.SETTINGS_KEY);
    if (!this.settings)
    {
      this.settings = new ThemeSettings();
      this.settings.darkMode = this.isSystemDark();
      this.startSystemModeSynchronization();
    }
  }

  //** Check if the user Operative System theme preference is dark mode. */
  isSystemDark(): boolean
  {
    const result: boolean = this.document.defaultView?.matchMedia(ThemeService.SYSTEM_DARK_MODE_MEDIA_QUERY).matches!;
    return result;
  }

  /**
   * Set stylesheet url for Kendo UI components.
   * @param stylesheetFilePath Kendo UI components css style sheet file path.
   */
  private setKendoUiControlsMode(stylesheetFilePath: string): void
  {
    this.renderer.setProperty(this.kendouiStylesheetHtmlElement, 'href', stylesheetFilePath);
  }

  /**
   * Set the theme mode.
   * @param darkMode True for dark mode. False for light mode.
   */
  private setMode(darkMode: boolean): void
  {
    if (darkMode)
    {
      this.renderer.removeClass(this.document.body, ThemeService.LIGHT_MODE_CSS_CLASS_NAME);
      this.setKendoUiControlsMode('kendoui-dark.css');
    }
    else
    {
      this.renderer.addClass(this.document.body, ThemeService.LIGHT_MODE_CSS_CLASS_NAME);
      this.setKendoUiControlsMode('kendoui-light.css');
    }
  }

  /** Apply the theme mode stored in the settings. */
  apply(): void
  {
    this.setMode(this.settings.darkMode);
  }

  /**
   * Observe and apply any future changes of user preferences of the theme mode through the operating system (dark or light).
   *
   * If the user decides to change the theme through the operating system, the changes will be immediately reflected in the application.
   *
   * @private
   */
  private startSystemModeSynchronization(): void
  {
    if ((!this.destructionSubject) && (this.document.defaultView))
    {
      this.destructionSubject = new Subject<void>();
      fromEvent(this.document.defaultView.matchMedia(ThemeService.SYSTEM_DARK_MODE_MEDIA_QUERY), 'change').pipe(
        takeUntil(this.destructionSubject)
      ).subscribe((e: Event) =>
      {
        const mediaqueryListEventMediaQueryListEvent: MediaQueryListEvent = e as MediaQueryListEvent;
        const darkMode = (mediaqueryListEventMediaQueryListEvent) ? mediaqueryListEventMediaQueryListEvent.matches : this.isSystemDark();
        this.setMode(darkMode);
      })
    }
  }

  /**
   * Stop observing and reflecting in the application the user's preferences about the theme in the operating system (dark or light).
   *
   * @private
   * @memberof ThemeService
   */
  private stopSystemModeSynchronization(): void
  {
    if (this.destructionSubject)
    {
      this.destructionSubject.next();
      this.destructionSubject.complete();
      this.destructionSubject = null;
    }
  }

  ngOnDestroy(): void {
    this.stopSystemModeSynchronization();
  }

  /** Apply the theme mode according to the user's operating system preferences. */
  setSystemMode(): void
  {
    const darkMode = this.isSystemDark();
    this.setMode(darkMode);
    this.startSystemModeSynchronization();
    this.removeLocalStorageItem(ThemeService.SETTINGS_KEY);
  }

  /**
   * Apply and persist in the configuration the theme mode chosen by the user within the application.
   * @param darkMode True for dark mode. False for light mode.
   */
  setUserDefinedMode(darkMode: boolean): void
  {
    this.setMode(darkMode);
    this.stopSystemModeSynchronization();
    this.settings.darkMode = darkMode;
    this.setLocalStorageItem(ThemeService.SETTINGS_KEY, this.settings);
  }

  //** Apply light mode. */
  setLightMode()
  {
    this.setUserDefinedMode(false);
  }

  /** Apply dark mode. */
  setDarkMode()
  {
    this.setUserDefinedMode(true);
  }
}
