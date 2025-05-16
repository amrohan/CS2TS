# C# to TypeScript Model Tools

This Angular application provides a suite of tools for developers working with C# models and their TypeScript equivalents. It features:

1.  **Model Generator:** Converts C# class definitions or property snippets into TypeScript interfaces.
2.  **Diff Checker:** Compares a C# model against an existing TypeScript interface to highlight differences, missing properties, or type mismatches.

The application is built with Angular 19+ features, including Standalone Components and Signals, and styled with Angular Material.

## Features

### Model Generator
*   **Input:** Paste your C# class code or a list of C# properties.
*   **Output:** Generates a corresponding TypeScript interface.
*   **Type Mapping:**
  *   Converts common C# primitive types (int, string, bool, DateTime, etc.) to their TypeScript equivalents (number, string, boolean, string/Date).
  *   Handles C# nullable types (`int?`, `string?`, `Nullable<T>`) by making TypeScript properties optional (`?:`) and/or adding `| null` to the type.
  *   Maps C# collections like `List<T>`, `IEnumerable<T>`, `ICollection<T>` to TypeScript arrays (`T[]`).
  *   Converts `Dictionary<TKey, TValue>` to TypeScript index signatures (`{ [key: TKey_TS]: TValue_TS }`), with appropriate key type mapping (string or number).
  *   Attempts to use the C# class name for the generated TypeScript interface name. Defaults to `GeneratedModel` if no class name is found.
  *   Property names are converted to camelCase.
*   **Copy to Clipboard:** Easily copy the generated TypeScript interface.
*   **Error Handling:** Displays parsing errors if the C# input is invalid.

### Diff Checker
*   **Input:**
  *   C# Model (Source): The C# class definition.
  *   Existing TypeScript Model (Target): The TypeScript interface to compare against.
*   **Comparison Logic:**
  1.  Converts the C# model to a temporary TypeScript interface.
  2.  Compares this generated interface with the provided existing TypeScript interface.
*   **Output:** A table displaying the comparison results:
  *   **Property:** The name of the property.
  *   **C# -> TS Type:** The type generated from the C# model.
  *   **Existing TS Type:** The type from the provided TypeScript model.
  *   **Status:**
    *   `Matching`: Property exists in both with the same type and optionality.
    *   `Missing in Existing TS`: Property exists in C# but not in the existing TypeScript model.
    *   `Additional in Existing TS`: Property exists in the TypeScript model but not in the C# model.
    *   `Type Mismatch`: Property exists in both, but their types differ.
    *   `Optionality Mismatch`: Property exists in both with the same base type, but their optionality (`?` or `| null`) differs.
*   **Clear Feedback:** Provides messages for parsing errors, successful comparisons, and cases where models are identical.

### General UI/UX
*   **Angular Material:** Modern and clean interface using Angular Material components.
*   **Responsive Design:** Adapts to different screen sizes.
*   **Intuitive Layout:** Two-tab interface for distinct functionalities.
*   **Sticky Headers & Scrollable Content:** For easy viewing of long code snippets and comparison tables.
*   **Auto-Resizing Text Areas:** Input areas adjust their height based on content.
*   **Notifications:** Uses `MatSnackBar` for user feedback (e.g., "Copied to clipboard!", "Error parsing C#").

## Tech Stack

*   **Angular 19+:** (Leveraging Standalone Components, Signals, new control flow syntax)
*   **TypeScript**
*   **Angular Material:** For UI components.
*   **Angular CDK:** For features like `cdkTextareaAutosize`.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm) installed (LTS version recommended).
*   [Angular CLI](https://angular.io/cli) installed globally: `npm install -g @angular/cli`

### Installation & Setup

1.  **Clone the repository (or download the source code):**
    ```bash
    git clone <repository-url>
    cd <project-directory-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

1.  **Serve the application:**
    ```bash
    ng serve -o
    ```
    This will compile the application and open it in your default web browser, typically at `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## How to Use

### Model Generator Tab

1.  Navigate to the "Model Generator" tab.
2.  Paste your C# class definition (e.g., `public class MyClass { ... }`) or a list of C# properties (e.g., `public string Name { get; set; } public int Age { get; set; }`) into the "C# Model Input" text area.
3.  Click the "Convert to TypeScript" button.
4.  The generated TypeScript interface will appear in the "Generated TypeScript" code block.
5.  If the generated code is valid, a "Copy" icon will appear in the header of the "Generated TypeScript" card. Click it to copy the code to your clipboard.
6.  Any parsing errors from the C# input will be displayed below the C# input area.

### Diff Checker Tab

1.  Navigate to the "Diff Checker" tab.
2.  Paste your C# class definition into the "C# Model (Source)" text area.
3.  Paste your existing TypeScript interface code into the "Existing TypeScript (Target)" text area.
4.  Click the "Check Differences" button.
5.  A table will display the comparison results, highlighting properties that are matching, missing, additional, or have type/optionality mismatches.
6.  Messages regarding the comparison (e.g., "Models are structurally identical!", parsing errors) will appear above the results table.

## Code Structure (Key Component: `app.component.ts`)

*   **Signals:** Used extensively for managing component state (e.g., `csharpModelGenerator`, `generatedTSOutput`, `comparisonResults`).
*   **`handleConvert()`:** Logic for the Model Generator.
*   **`handleCheckDifferences()`:** Logic for the Diff Checker.
*   **`copyGeneratedTS()`:** Copies generated TypeScript to the clipboard.
*   **`convertCSharpToTS()`:** The core C# to TypeScript conversion function.
  *   `extractClassNameFromCSharp()`: Helper to get class name.
  *   `mapCSharpTypeToTSType()`: Maps C# types to TypeScript types, handling nullability and collections.
*   **`compareTypeScriptInterfaces()`:** The core comparison function.
  *   `extractPropertiesFromTSInterface()`: Parses TypeScript interface strings to extract property names, types, and optionality.
*   **`getStatusClass()`:** Helper for applying CSS classes to table cells based on comparison status.
*   **`showNotification()`:** Displays `MatSnackBar` messages.

The HTML (`app.component.html`) uses Angular Material components and the new `@if`/`@else if` control flow syntax for conditional rendering. CSS (`app.component.css`) provides custom styling and layout enhancements.

## Future Enhancements (Potential Ideas)

*   **Configuration Options:**
  *   Option to choose between `Date` or `string` for C# `DateTime`.
  *   Option for different casing conventions (e.g., preserve original C# casing).
  *   Option to generate enums.
*   **Support for C# Records and Structs.**
*   **More Complex Generic Type Handling.**
*   **Handling C# Attributes/Decorators:** Potentially map common attributes (e.g., `[Required]`, `[JsonPropertyName]`) to TypeScript comments or decorators if a specific framework is targeted (e.g., class-validator).
*   **Batch Conversion:** Allow converting multiple C# files/classes at once.
*   **Reverse Conversion (TS to C#):** A more challenging but potentially useful feature.
*   **Saving/Loading Models:** Persist input/output.
*   **Theming:** Allow users to switch between light/dark themes.

## Contributing

Contributions are welcome! If you have suggestions for improvements or find any bugs, please feel free to open an issue or submit a pull request.

---
