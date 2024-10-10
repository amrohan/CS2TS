using System;
using System.IO;

void Main()
{
#if DEBUG
    // Use hardcoded path for debugging eg:
    string currentDirectory = @"D:\project\cstots";
#else
    // Use the actual current directory in release mode
    string currentDirectory = Directory.GetCurrentDirectory();
#endif
    Console.WriteLine("Current directory: " + currentDirectory);

    string[] files = Directory.GetFiles(currentDirectory);
    Console.WriteLine("Files in the current directory:");
    for (int i = 0; i < files.Length; i++)
    {
        if (Path.GetExtension(files[i]).Equals(".cs", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine($"{i + 1}: {Path.GetFileName(files[i])}");
        }
    }

    Console.Write("Enter the number of the C# file to convert (or press Enter to use 'model.cs'): ");
    string userInput = Console.ReadLine();
    string csharpFilePath = userInput == "" ? Path.Combine(currentDirectory, "model.cs") : files[int.Parse(userInput) - 1];

    Console.Write("Enter the name of the TypeScript output file (default: 'model.ts'): ");
    string typescriptFileName = Console.ReadLine();
    string typescriptFilePath = string.IsNullOrEmpty(typescriptFileName) ? Path.Combine(currentDirectory, "model.ts") : Path.Combine(currentDirectory, typescriptFileName).Replace(".ts", "") + ".ts";
    if (File.Exists(typescriptFilePath))
    {
        Console.WriteLine("File already exist");
        return;
    }
    try
    {
        string csharpCode = File.ReadAllText(csharpFilePath);
        string typescriptCode = ConvertCSharpToTypeScript(csharpCode);

        File.WriteAllText(typescriptFilePath, typescriptCode);
        Console.WriteLine("TypeScript class generated at: " + typescriptFilePath);
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error: " + ex.Message);
    }
}

string ConvertCSharpToTypeScript(string csharpCode)
{
    int classStart = csharpCode.IndexOf("class") + 5;
    int classEnd = csharpCode.IndexOf("{", classStart);
    string className = csharpCode.Substring(classStart, classEnd - classStart).Trim();

    string typescriptCode = $"export class {className} {{\n";

    string classBody = csharpCode.Substring(classEnd + 1);
    string[] lines = classBody.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);

    foreach (string line in lines)
    {
        string trimmedLine = line.Trim();

        if (trimmedLine.StartsWith("//") || string.IsNullOrEmpty(trimmedLine))
            continue;

        if (trimmedLine.StartsWith("public") || trimmedLine.StartsWith("private") || trimmedLine.StartsWith("protected") || trimmedLine.StartsWith("internal"))
        {
            if (trimmedLine.Contains("{") || trimmedLine.Contains(";"))
            {
                string property = trimmedLine.Split(new[] { '{', ';' }, StringSplitOptions.RemoveEmptyEntries)[0].Trim();
                string[] parts = property.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length >= 2)
                {

                    string access = parts.Length > 2 ? parts[0] : "";

                    string type = parts[^2];
                    string name = parts[^1];

                    type = ConvertType(type);

                    typescriptCode += $"    {access} {name}: {type};\n";
                }
                else
                {
                    Console.WriteLine($"Warning: Skipping line due to insufficient parts: '{trimmedLine}'");
                }
            }
            continue;
        }
    }

    typescriptCode += "}\n";
    return typescriptCode;
}

string ConvertType(string csharpType)
{
    return csharpType switch
    {
        "int" => "number",
        "long" => "number",
        "short" => "number",
        "byte" => "number",
        "char" => "string",
        "string" => "string",
        "bool" => "boolean",
        "double" => "number",
        "float" => "number",
        "decimal" => "number",
        "DateTime" => "Date",
        var s when s.StartsWith("List<") => $"Array<{ConvertType(s[5..^1])}>",
        var s when s.StartsWith("IEnumerable<") => $"Array<{ConvertType(s[12..^1])}>",
        var s when s.StartsWith("Dictionary<") =>
            $"Record<{ConvertType(s[11..s.IndexOf(',')])}, {ConvertType(s[(s.IndexOf(',') + 1)..^1])}>",
        var s when s.StartsWith("HashSet<") => $"Set<{ConvertType(s[8..^1])}>",
        var s when s.StartsWith("Queue<") => $"Queue<{ConvertType(s[6..^1])}>",
        var s when s.StartsWith("Stack<") => $"Stack<{ConvertType(s[6..^1])}>",
        _ => "any"
    };
}


Main();
