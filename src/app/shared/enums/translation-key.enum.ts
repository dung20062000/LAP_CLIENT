/**
 * Người tạo: DungBT
 * Ngày tạo: 19/06/2026
 * Enum quản lý toàn bộ translation keys trong ứng dụng để dễ maintain và tái sử dụng.
 */
export enum TranslationKey {
  // Login
  LoginErrInvalidCredentials = 'login.err_invalid_credentials',
  LoginUsernamePlaceholder = 'login.username_placeholder',
  LoginErrUsernameRequired = 'login.err_username_required',
  LoginErrUsernamePattern = 'login.err_username_pattern',
  LoginErrUsernameMaxlength = 'login.err_username_maxlength',
  LoginPasswordPlaceholder = 'login.password_placeholder',
  LoginPasswordHide = 'login.password_hide',
  LoginPasswordShow = 'login.password_show',
  LoginErrPasswordRequired = 'login.err_password_required',
  LoginErrPasswordMaxlength = 'login.err_password_maxlength',
  LoginRememberMe = 'login.remember_me',
  LoginForgotPassword = 'login.forgot_password',
  LoginBtnLoading = 'login.btn_loading',
  LoginBtnLogin = 'login.btn_login',
  LoginQrText = 'login.qr_text',

  // Banner
  BannerAriaPrev = 'banner.aria_prev',
  BannerAriaNext = 'banner.aria_next',
  BannerAriaSlide = 'banner.aria_slide',
  BannerBtnDetail = 'banner.btn_detail',

  // Footer
  FooterCityHanoi = 'footer.city.hanoi',
  FooterCityHaiphong = 'footer.city.haiphong',
  FooterCityNghean = 'footer.city.nghean',
  FooterCityHatinh = 'footer.city.hatinh',
  FooterCityDanang = 'footer.city.danang',
  FooterCityHcm = 'footer.city.hcm',

  // Header
  HeaderGreeting = 'header.greeting',
  HeaderLogout = 'header.logout',
  HeaderSelectLanguage = 'header.select_language',
  
  // Navigation
  NavHome = 'nav.home',
  NavProducts = 'nav.products',
  NavNews = 'nav.news',
  NavPayment = 'nav.payment',
  NavGuide = 'nav.guide',
  NavNetwork = 'nav.network',
  NavAbout = 'nav.about',

  // Common
  CommonZalo = 'common.zalo',
  CommonHotline = 'common.hotline',
}
