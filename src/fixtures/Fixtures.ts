import type { CartPage, CheckoutPage, HomePage, InventoryPage, LoginPage } from '@pages';
import { Page } from '@playwright/test';
import type { ApiClient, ApiOptions, ApolloClient, SoapClient, SoapOptions } from '@utils';

import {
  CheckoutDataset,
  calculatorSchema,
  calculatorSoapData,
  capitalCitySchema,
  contactSchema,
  contactsData,
  contactsListSchema,
  countryInfoSoapData,
  countryNameSchema,
  healthSchema,
  numberConversionSoapData,
  numberToDollarsSchema,
  numberToWordsSchema,
  profileSchema,
  profilesData,
  userSchema,
  usersData,
  usersListSchema,
} from '@data';

export type Fixtures = {
  // Services
  apiService: ApiClient;
  apolloClient: ApolloClient;
  apiServiceOptions: ApiOptions;
  apolloClientOptions: {
    uri?: string;
    headers?: Record<string, string>;
  };
  soapService: SoapClient;
  soapServiceOptions: SoapOptions;

  // API test data
  apiData: {
    contacts: typeof contactsData;
    users: typeof usersData;
    profiles: typeof profilesData;
  };

  // API schemas
  apiSchemas: {
    userSchema: typeof userSchema;
    usersListSchema: typeof usersListSchema;
    profileSchema: typeof profileSchema;
    contactSchema: typeof contactSchema;
    contactsListSchema: typeof contactsListSchema;
    healthSchema: typeof healthSchema;
  };

  // SOAP test data
  soapData: {
    calculator: typeof calculatorSoapData;
    countryInfo: typeof countryInfoSoapData;
    numberConversion: typeof numberConversionSoapData;
  };

  // SOAP schemas
  soapSchemas: {
    calculatorSchema: typeof calculatorSchema;
    capitalCitySchema: typeof capitalCitySchema;
    countryNameSchema: typeof countryNameSchema;
    numberToWordsSchema: typeof numberToWordsSchema;
    numberToDollarsSchema: typeof numberToDollarsSchema;
  };

  // UI test data
  checkoutData: CheckoutDataset;

  // Pages
  authedPage: Page; // internal in tests if needed
  loginPage: LoginPage;
  homePage: HomePage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};
