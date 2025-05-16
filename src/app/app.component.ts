import {Component, signal, ChangeDetectionStrategy, WritableSignal, computed} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import {NgClass} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';

interface PropertyDefinition {
  name: string;
  type: string;
  isOptional: boolean;
}

const PLACEHOLDER_GENERATED_TS = '// Converted TypeScript will appear here';
const PLACEHOLDER_ENTER_CSHARP = '// Enter C# model to generate TypeScript.';
const MSG_MODELS_IDENTICAL = 'Models are structurally identical!';

interface ComparisonResult {
  property: string;
  generatedType?: string;
  existingType?: string;
  status:
    | 'Matching'
    | 'Missing in Existing TS'
    | 'Additional in Existing TS'
    | 'Type Mismatch'
    | 'Optionality Mismatch';
}

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    NgClass,
    MatTooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  // --- Signals for Model Generator Tab ---
  csharpModelGenerator: WritableSignal<string> = signal('');
  generatedTSOutput: WritableSignal<string> = signal('// Converted TypeScript will appear here');
  csharpParseErrorGenerator: WritableSignal<string | null> = signal(null);

  // --- Signals for Diff Checker Tab ---
  csharpModelDiff: WritableSignal<string> = signal('');
  existingTSModelDiff: WritableSignal<string> = signal('');
  comparisonResults: WritableSignal<ComparisonResult[]> = signal([]);
  csharpParseErrorDiff: WritableSignal<string | null> = signal(null);
  diffCheckerMessage: WritableSignal<string | null> = signal(null);

  // Table columns for diff checker
  displayedColumns: string[] = ['property', 'generatedType', 'existingType', 'status'];

  canCopyGeneratedTS = computed(() => {
    const output = this.generatedTSOutput();
    return output && output !== PLACEHOLDER_GENERATED_TS && output !== PLACEHOLDER_ENTER_CSHARP && !output.startsWith('// Error parsing C#');
  });

  constructor(private snackBar: MatSnackBar) {}

  handleConvert(): void {
    this.csharpParseErrorGenerator.set(null);
    const csharpCode = this.csharpModelGenerator().trim();
    if (!csharpCode) {
      this.generatedTSOutput.set('// Enter C# model to generate TypeScript.');
      this.showNotification('Please enter C# code.', 'Warning');
      return;
    }
    try {
      const tsCode = this.convertCSharpToTS(csharpCode);
      this.generatedTSOutput.set(tsCode);
      this.showNotification('C# model converted successfully!', 'Info');
    } catch (error: any) {
      const errorMessage = `Error parsing C# for generator: ${error.message}`;
      this.csharpParseErrorGenerator.set(errorMessage);
      this.generatedTSOutput.set(`// ${errorMessage}`);
      this.showNotification(errorMessage, 'Error');
    }
  }

  handleCheckDifferences(): void {
    this.csharpParseErrorDiff.set(null);
    this.comparisonResults.set([]);
    this.diffCheckerMessage.set(null);

    const csharpCode = this.csharpModelDiff().trim();
    const existingTSCode = this.existingTSModelDiff().trim();

    if (!csharpCode) {
      this.diffCheckerMessage.set('Please enter the C# model for comparison.');
      this.showNotification('C# model is required for diff checking.', 'Warning');
      return;
    }

    let generatedTSFromCSharp: string;
    try {
      generatedTSFromCSharp = this.convertCSharpToTS(csharpCode);
    } catch (error: any) {
      const errorMessage = `Error parsing C# for diff checker: ${error.message}`;
      this.csharpParseErrorDiff.set(errorMessage);
      this.showNotification(errorMessage, 'Error');
      return;
    }

    if (!existingTSCode) {
      const genProps = this.extractPropertiesFromTSInterface(generatedTSFromCSharp);
      this.comparisonResults.set(
        genProps.map(p => ({
          property: p.name,
          generatedType: `${p.type}${p.isOptional ? ' (Optional)' : ''}`,
          status: 'Missing in Existing TS' as 'Missing in Existing TS',
        }))
      );
      if (genProps.length > 0) {
        this.diffCheckerMessage.set('Existing TypeScript model is empty. Showing C# model properties.');
      } else {
        this.diffCheckerMessage.set('C# model generated an empty interface, and existing TypeScript is empty.');
      }
      this.showNotification('Compared with empty existing TypeScript model.', 'Info');
      return;
    }

    try {
      const results = this.compareTypeScriptInterfaces(generatedTSFromCSharp, existingTSCode);
      this.comparisonResults.set(results);
      if (results.length > 0) {
        this.showNotification('Comparison complete.', 'Info');
      } else {
        this.diffCheckerMessage.set('No properties found in either model or both models are identical in structure (if properties exist).');
        this.showNotification('Comparison complete. No differences or no properties found.', 'Info');
      }
    } catch (error: any) {
      const errorMessage = `Error during comparison: ${error.message}`;
      this.diffCheckerMessage.set(errorMessage);
      this.showNotification(errorMessage, 'Error');
    }
  }


  showNotification(message: string, panelClass: 'Error' | 'Warning' | 'Info' = 'Info') {
    this.snackBar.open(message, 'Close', {
      duration: panelClass === 'Error' ? 7000 : 4000,
      panelClass: panelClass.toLowerCase(),
    });
  }

  async copyGeneratedTS(): Promise<void> {
    if (!this.canCopyGeneratedTS()) {
      this.showNotification('Nothing to copy or output contains an error.', 'Warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(this.generatedTSOutput());
      this.showNotification('TypeScript model copied to clipboard!', 'Info');
    } catch (err) {
      this.showNotification('Failed to copy text.', 'Error');
      console.error('Failed to copy text: ', err);
    }
  }

  private extractClassNameFromCSharp(csharpCode: string): string {
    const classMatch = csharpCode.match(/(?:public|internal|private)\s+(?:sealed\s+|abstract\s+)?class\s+(\w+)/);
    return classMatch ? classMatch[1] : 'GeneratedModel';
  }

  private convertCSharpToTS(csharpCode: string): string {
    const interfaceName = this.extractClassNameFromCSharp(csharpCode);
    const tsProperties: string[] = [];

    const propertyRegex = /public\s+((?:[\w\.<>\?\[\]]+(?:\[\])?))\s+(\w+)\s*{\s*get;\s*(?:set;|init;)?\s*}/g;
    let match;
    let propertiesFound = false;

    while ((match = propertyRegex.exec(csharpCode)) !== null) {
      propertiesFound = true;
      const csharpType = match[1];
      const csharpName = match[2];

      const { tsType, isOptional } = this.mapCSharpTypeToTSType(csharpType);
      const tsName = csharpName.charAt(0).toLowerCase() + csharpName.slice(1);
      const optionalMarker = isOptional ? '?' : '';

      tsProperties.push(`  ${tsName}${optionalMarker}: ${tsType};`);
    }

    if (!propertiesFound && !csharpCode.match(/class\s+\w+/)) {
      const lines = csharpCode.split('\n');
      const loosePropertyRegex = /(?:public|private|internal)?\s*((?:[\w\.<>\?\[\]]+(?:\[\])?))\s+(\w+)\s*{\s*get;\s*(?:set;|init;)?\s*}/;
      lines.forEach(line => {
        const looseMatch = line.match(loosePropertyRegex);
        if (looseMatch) {
          propertiesFound = true;
          const csharpType = looseMatch[1];
          const csharpName = looseMatch[2];
          const { tsType, isOptional } = this.mapCSharpTypeToTSType(csharpType);
          const tsName = csharpName.charAt(0).toLowerCase() + csharpName.slice(1);
          const optionalMarker = isOptional ? '?' : '';
          tsProperties.push(`  ${tsName}${optionalMarker}: ${tsType};`);
        }
      });
    }


    if (!propertiesFound) {
      if (csharpCode.match(/class\s+\w+/)) {
        return `interface ${interfaceName} {\n  // No public properties with get;set; or get;init; found or matched.\n}`;
      }
      throw new Error("No valid C# properties found. Ensure properties are public and have get;set; or get;init;. Example: public string Name { get; set; }");
    }

    return `interface ${interfaceName} {\n${tsProperties.join('\n')}\n}`;
  }

  private mapCSharpTypeToTSType(csharpType: string): { tsType: string; isOptional: boolean } {
    let processedType = csharpType.trim();
    let isSystemNullable = false;
    let isReferenceNullable = false;

    // Handle Nullable<T>
    const nullableMatch = processedType.match(/^Nullable<(.+)>$/i);
    if (nullableMatch) {
      processedType = nullableMatch[1];
      isSystemNullable = true;
    }

    // Handle C# 8 nullable reference suffix '?'
    if (processedType.endsWith('?')) {
      processedType = processedType.slice(0, -1);
      isReferenceNullable = true;
    }

    let isArray = false;
    if (processedType.endsWith('[]')) {
      processedType = processedType.slice(0, -2);
      isArray = true;
    }

    let finalTsType: string;

    const collectionMatch = processedType.match(/^(?:IEnumerable|ICollection|IList|List|IReadOnlyList|IReadOnlyCollection|ISet|HashSet)<([\w\.<>\?]+)>/i);
    if (collectionMatch) {
      const itemType = this.mapCSharpTypeToTSType(collectionMatch[1]).tsType;
      finalTsType = `${itemType}[]`;
    }
    else if (processedType.match(/^(?:IDictionary|Dictionary|IReadOnlyDictionary|SortedDictionary|SortedList)<\s*([\w\.<>\?]+)\s*,\s*([\w\.<>\?]+)\s*>/i)) {
      const dictMatch = processedType.match(/^(?:IDictionary|Dictionary|IReadOnlyDictionary|SortedDictionary|SortedList)<\s*([\w\.<>\?]+)\s*,\s*([\w\.<>\?]+)\s*>/i);
      if (dictMatch) {
        const keyCSharpType = dictMatch[1];
        const valueCSharpType = dictMatch[2];
        let keyTsType = this.mapCSharpTypeToTSType(keyCSharpType).tsType;
        const valueTsType = this.mapCSharpTypeToTSType(valueCSharpType).tsType;

        if (keyTsType.includes('number')) keyTsType = 'number';
        else if (keyTsType.includes('string')) keyTsType = 'string';
        else {
          this.showNotification(`Dictionary key type "${keyCSharpType}" mapped to "${keyTsType}". Forcing to 'string' for TS indexer.`, "Warning");
          keyTsType = 'string';
        }
        finalTsType = `{ [key: ${keyTsType}]: ${valueTsType} }`;
      } else {
        finalTsType = 'Record<any, any>';
      }
    }
    else {
      const typeMap: { [key: string]: string } = {
        'int': 'number', 'short': 'number', 'long': 'number', 'byte': 'number', 'sbyte': 'number',
        'uint': 'number', 'ushort': 'number', 'ulong': 'number',
        'float': 'number', 'double': 'number', 'decimal': 'number',
        'string': 'string', 'char': 'string', 'guid': 'string',
        'bool': 'boolean',
        'datetime': 'string',
        'datetimeoffset': 'string',
        'timespan': 'string',
        'object': 'any',
        'void': 'void',
      };
      finalTsType = typeMap[processedType.toLowerCase()] || processedType;
    }

    if (isArray) {
      finalTsType += '[]';
    }

    const isOptional = isSystemNullable || isReferenceNullable;

    if (isOptional && finalTsType !== 'any' && finalTsType !== 'void' && !finalTsType.includes('| null') && !finalTsType.includes('| undefined')) {
      finalTsType += ' | null';
    }

    return { tsType: finalTsType, isOptional };
  }

  private extractPropertiesFromTSInterface(interfaceStr: string): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    if (!interfaceStr || !interfaceStr.includes('{')) return properties;


    const bodyMatch = interfaceStr.match(/interface\s+\w+(?:<[^>]+>)?\s*{([\s\S]*)}/);
    if (!bodyMatch || !bodyMatch[1]) return properties;

    const interfaceBody = bodyMatch[1];
    const lines = interfaceBody.split('\n');

    // Regex to match a property line: `  propertyName?: type;  `
    // Allows for complex types including generics, unions, intersections, arrays.
    const propRegex = /^\s*([\w$_][\w\d$_]*)\s*(\??)\s*:\s*([^;]+?)\s*;?\s*$/;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) return;

      const match = trimmedLine.match(propRegex);
      if (match) {
        properties.push({
          name: match[1],
          isOptional: match[2] === '?',
          type: match[3].trim().replace(/;$/, ''),
        });
      }
    });
    return properties;
  }

  private compareTypeScriptInterfaces(generatedTSCode: string, existingTSCode: string): ComparisonResult[] {
    const genProps = this.extractPropertiesFromTSInterface(generatedTSCode);
    const existProps = this.extractPropertiesFromTSInterface(existingTSCode);
    const results: ComparisonResult[] = [];

    const genPropsMap = new Map(genProps.map(p => [p.name, p]));
    const existPropsMap = new Map(existProps.map(p => [p.name, p]));


    const normalizeType = (typeStr: string) => typeStr.split('|').map(s => s.trim()).sort().join(' | ');


    genProps.forEach(genProp => {
      const existProp = existPropsMap.get(genProp.name);
      const genPropTypeDisplay = `${genProp.type}${genProp.isOptional ? ' (Optional)' : ''}`;

      if (!existProp) {
        results.push({
          property: genProp.name,
          generatedType: genPropTypeDisplay,
          status: 'Missing in Existing TS',
        });
      } else {
        const existPropTypeDisplay = `${existProp.type}${existProp.isOptional ? ' (Optional)' : ''}`;
        const normalizedGenType = normalizeType(genProp.type);
        const normalizedExistType = normalizeType(existProp.type);

        if (normalizedGenType !== normalizedExistType) {
          results.push({
            property: genProp.name,
            generatedType: genProp.type,
            existingType: existProp.type,
            status: 'Type Mismatch',
          });
        } else if (genProp.isOptional !== existProp.isOptional) {
          results.push({
            property: genProp.name,
            generatedType: genPropTypeDisplay,
            existingType: existPropTypeDisplay,
            status: 'Optionality Mismatch',
          });
        } else {
          results.push({
            property: genProp.name,
            generatedType: genProp.type,
            existingType: existProp.type,
            status: 'Matching',
          });
        }
      }
    });


    existProps.forEach(existProp => {
      if (!genPropsMap.has(existProp.name)) {
        results.push({
          property: existProp.name,
          existingType: `${existProp.type}${existProp.isOptional ? ' (Optional)' : ''}`,
          status: 'Additional in Existing TS',
        });
      }
    });


    results.sort((a, b) => {
      if (a.status === 'Matching' && b.status !== 'Matching') return 1;
      if (a.status !== 'Matching' && b.status === 'Matching') return -1;
      return a.property.localeCompare(b.property);
    });

    return results;
  }
}
