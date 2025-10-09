# Smart Context Menu for Angular Structural Directives

## 🎯 **How It Works**

The context menu "Convert Structural Directive to Control Flow" now appears intelligently based on your cursor position:

### ✅ **Context Menu WILL appear when:**

#### In HTML Template Files (.html)
```html
<!-- Right-click on these lines to see the context menu -->
<div *ngIf="showContent">Content</div>
<li *ngFor="let item of items; let i = index">{{ item }}</li>
<div [ngSwitch]="viewType">
  <span *ngSwitchCase="'list'">List View</span>
  <span *ngSwitchDefault>Default</span>
</div>
```

#### In TypeScript Components (.ts) with Inline Templates
```typescript
@Component({
  selector: 'app-example',
  template: `
    <div>
      <!-- Right-click on these lines to see the context menu -->
      <p *ngIf="condition">Show this</p>
      <ul>
        <li *ngFor="let item of data">{{ item }}</li>
      </ul>
    </div>
  `
})
export class ExampleComponent {}
```

### ❌ **Context Menu will NOT appear when:**

#### Regular HTML without structural directives
```html
<!-- No context menu on these lines -->
<div class="container">
  <p>Regular paragraph</p>
  <span>Normal content</span>
</div>
```

#### TypeScript code outside templates
```typescript
// No context menu in regular TypeScript code
export class ExampleComponent {
  private data: string[] = [];
  
  constructor() {
    this.loadData(); // No context menu here
  }
}
```

## 🚀 **Usage Instructions**

1. **Open an Angular template file** (.html) or component file (.ts)
2. **Position your cursor** on a line containing:
   - `*ngFor="..."`
   - `*ngIf="..."`
   - `*ngSwitch` / `[ngSwitch]="..."`
   - `*ngSwitchCase="..."`
   - `*ngSwitchDefault`
3. **Right-click** to open the context menu
4. **Click "Convert Structural Directive to Control Flow"**
5. **Watch the magic happen!** ✨

## 📋 **Examples of Conversions**

### Before (Old Syntax)
```html
<div *ngFor="let user of users; let i = index; trackBy: trackByUserId">
  <p *ngIf="user.isActive">{{ i + 1 }}. {{ user.name }}</p>
</div>

<div [ngSwitch]="currentView">
  <app-list *ngSwitchCase="'list'"></app-list>
  <app-grid *ngSwitchCase="'grid'"></app-grid>
  <app-default *ngSwitchDefault></app-default>
</div>
```

### After (New Control Flow)
```html
<div @for (user of users; track trackByUserId(user); let i = $index)>
  <p @if (user.isActive)>{{ i + 1 }}. {{ user.name }}</p>
</div>

<div @switch (currentView)>
  <app-list @case ('list')></app-list>
  <app-grid @case ('grid')></app-grid>
  <app-default @default></app-default>
</div>
```

## 🎉 **Benefits**

- **Smart Detection**: Only shows when actually needed
- **Context Aware**: Works in both .html and .ts files
- **Position Specific**: Cursor must be on the directive line
- **Instant Conversion**: One right-click to modernize your code
- **Precise Targeting**: No more guessing if the command will work

## ⚡ **Performance**

- **Lightweight**: Context detection adds minimal overhead
- **Real-time**: Updates as you move your cursor
- **Efficient**: Only active when cursor is on relevant content

The smart context menu ensures you always see the conversion option exactly when and where you need it!