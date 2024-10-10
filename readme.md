# C# to TypeScript Converter

This project provides a simple console application to convert C# class definitions to TypeScript classes. It reads C# code from a specified file, converts it into TypeScript syntax, and writes the output to a specified TypeScript file.

## Features

- **C# to TypeScript Conversion**: Converts various C# data types to their corresponding TypeScript types.
- **Support for Basic Access Modifiers**: Recognizes and preserves public, private, and protected access modifiers in the generated TypeScript code.
- **Handles Collections**: Converts common C# collections such as `List<T>`, `IEnumerable<T>`, `Dictionary<K, V>`, `HashSet<T>`, `Queue<T>`, and `Stack<T>` to their TypeScript equivalents.
- **Constructor Handling**: While constructors are ignored in the conversion, the application can be easily modified to include them if needed.
- **User Interaction**: Allows users to choose a C# file from the current directory or provide a hardcoded path (for debugging).
- **File Existence Check**: Checks if the output TypeScript file already exists before writing to avoid overwriting.

## Installation

1. Clone the repository or download the code files.
2. Open the project in your preferred C# development environment (e.g., Visual Studio, VSCode).
3. Build the project to restore dependencies.

## Usage

1. Run the application.
2. The current directory or a predefined path (in debug mode) will be displayed.
3. The application lists all `.cs` files in the current directory.
4. Enter the number corresponding to the desired C# file or press Enter to use the default `model.cs`.
5. Specify the output TypeScript file name (default is `model.ts`).
6. The application will generate the TypeScript file if it does not already exist.

### Example

#### Input C# Class

```csharp
public class UserProfile
{
    private int userId;
    protected string password;
    public string FullName { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; }
}
```

#### Generated TypeScript Class

```typescript
export class UserProfile {
    private userId: number;
    protected password: string;
    public FullName: string;
    public Email: string;
    public Roles: Array<string>;
}
```

## Limitations

- **No Support for Methods**: The current implementation does not convert methods or constructors into TypeScript.
- **Limited Type Mapping**: Some advanced C# types or custom types may not be supported.
- **Basic Error Handling**: Error handling is present but may need enhancements for production use.
- **No Asynchronous Support**: The application runs synchronously and may block while reading/writing files.

## Contribution

Contributions are welcome! If you have suggestions or improvements, please feel free to create a pull request.

## License

This project is open-source and available under the MIT License.
```

### Notes
- Feel free to modify sections like **Installation**, **Usage**, and **Contribution** based on how you want to manage your project.
- You can add more features or limitations as you expand the functionality of your converter.