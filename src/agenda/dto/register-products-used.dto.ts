export class ProductUsedDto {
    productId: number;
    quantity: number;
  }
  
  export class RegisterProductsUsedDto {
    products: ProductUsedDto[];
  }
  