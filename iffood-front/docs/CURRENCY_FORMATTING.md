# Formatação de Preços - Documentação

## Funções Utilitárias (`/utils/currency.ts`)

### 1. `formatCentsToReais(cents: number): string`

Converte centavos para formato de reais com vírgula.

**Exemplo:**

```typescript
formatCentsToReais(1400); // "14,00"
formatCentsToReais(12550); // "125,50"
formatCentsToReais(99); // "0,99"
```

### 2. `formatCentsToReaisWithSymbol(cents: number): string`

Converte centavos para formato de reais com símbolo R$.

**Exemplo:**

```typescript
formatCentsToReaisWithSymbol(1400); // "R$ 14,00"
formatCentsToReaisWithSymbol(12550); // "R$ 125,50"
```

### 3. `formatPriceInput(value: string): string`

Aplica máscara de entrada de preço começando pelos centavos.

**Comportamento:**

- Usuário digita começando pelos centavos
- Automaticamente formata para reais,centavos

**Exemplo:**

```typescript
// Usuário digita "1" -> "0,01"
formatPriceInput("1"); // "0,01"

// Usuário digita "14" -> "0,14"
formatPriceInput("14"); // "0,14"

// Usuário digita "140" -> "1,40"
formatPriceInput("140"); // "1,40"

// Usuário digita "1400" -> "14,00"
formatPriceInput("1400"); // "14,00"

// Usuário digita "14000" -> "140,00"
formatPriceInput("14000"); // "140,00"
```

### 4. `parsePriceInputToCents(formattedValue: string): number`

Converte o valor formatado de volta para centavos.

**Exemplo:**

```typescript
parsePriceInputToCents("14,00"); // 1400
parsePriceInputToCents("125,50"); // 12550
parsePriceInputToCents("0,99"); // 99
```

## Componentes Atualizados

### Exibição de Preços

Todos os componentes que exibem preços foram atualizados:

- ✅ `product-card.tsx` - Card de produto na lista
- ✅ `busca/index.tsx` - Página de busca
- ✅ `ver-todos/index.tsx` - Página ver todos
- ✅ `home/index.tsx` - Página inicial
- ✅ `loja/index.tsx` - Página da loja
- ✅ `produto-detalhes/index.tsx` - Detalhes do produto

### Input de Preço

O formulário de criação/edição de produto (`produto/index.tsx`) agora usa a máscara:

**Antes:**

```tsx
<input
  type="number"
  step="0.01"
  value={productPrice}
  onChange={(e) => setProductPrice(e.target.value)}
  placeholder="0.00"
/>
```

**Depois:**

```tsx
<input
  type="text"
  value={productPrice}
  onChange={(e) => setProductPrice(formatPriceInput(e.target.value))}
  placeholder="0,00"
/>
```

## Padrão de Uso

### Para Exibir Preços:

```tsx
import { formatCentsToReaisWithSymbol } from "@/utils/currency";

// Em qualquer componente
<div>{formatCentsToReaisWithSymbol(product.value)}</div>;
// Resultado: "R$ 14,00" para product.value = 1400
```

### Para Inputs de Preço:

```tsx
import { formatPriceInput, parsePriceInputToCents } from "@/utils/currency";

const [price, setPrice] = useState("");

<input
  type="text"
  value={price}
  onChange={(e) => setPrice(formatPriceInput(e.target.value))}
  placeholder="0,00"
/>;

// Ao enviar para API:
const priceInCents = parsePriceInputToCents(price);
```
