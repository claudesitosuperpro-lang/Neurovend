using System.IO.Ports;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseWindowsService();

// Permitir llamadas desde el frontend Angular (localhost)
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(p =>
        p.SetIsOriginAllowed(_ => true)
         .AllowAnyHeader()
         .AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

// ═══════════════════════════════════════════════════════════════════════════════
// BÁSCULA
// ═══════════════════════════════════════════════════════════════════════════════

// GET /peso?puerto=COM3&baudrate=9600
app.MapGet("/peso", (string puerto, int baudrate = 9600) =>
{
    try
    {
        using var port = new SerialPort(puerto, baudrate, Parity.None, 8, StopBits.One)
        {
            ReadTimeout = 1500,
            WriteTimeout = 500
        };
        port.Open();
        port.Write(new byte[] { 0x50 }, 0, 1); // Comando 'P'
        Thread.Sleep(300);

        var buffer = new byte[32];
        var bytesRead = port.Read(buffer, 0, buffer.Length);
        port.Close();

        var respuesta = Encoding.ASCII.GetString(buffer, 0, bytesRead).Trim();
        respuesta = Regex.Replace(respuesta, "[^0-9.]", "");

        if (double.TryParse(respuesta, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var peso) && peso > 0)
            return Results.Ok(new { peso });

        return Results.BadRequest(new { error = "La báscula no respondió o la respuesta es inválida" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"No se pudo leer la báscula en {puerto}: {ex.Message}");
    }
});

// GET /puertos — lista los puertos seriales disponibles en el sistema
app.MapGet("/puertos", () => Results.Ok(SerialPort.GetPortNames()));

// ═══════════════════════════════════════════════════════════════════════════════
// IMPRESORA
// ═══════════════════════════════════════════════════════════════════════════════

// GET /impresoras — lista impresoras instaladas (solo Windows)
app.MapGet("/impresoras", () =>
{
    if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        return Results.Ok(Array.Empty<string>());

    var impresoras = new List<string>();
    foreach (string p in System.Drawing.Printing.PrinterSettings.InstalledPrinters)
        impresoras.Add(p);
    return Results.Ok(impresoras);
});

// POST /imprimir
// Body: { "impresora": "Impresora Termica", "contenidoBase64": "<bytes ESC/POS en base64>" }
app.MapPost("/imprimir", (ImprimirRequest req) =>
{
    try
    {
        var bytes = Convert.FromBase64String(req.ContenidoBase64);
        RawPrinter.Imprimir(req.Impresora, bytes);
        return Results.Ok(new { ok = true });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al imprimir: {ex.Message}");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════════════════════════════
app.MapGet("/", () => Results.Ok(new { status = "NEUROVEND HardwareBridge activo" }));

app.Run("http://localhost:5001");

// ─── DTOs ────────────────────────────────────────────────────────────────────
record ImprimirRequest(string Impresora, string ContenidoBase64);

// ─── Raw Printer (Windows API via P/Invoke) ──────────────────────────────────
static class RawPrinter
{
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter")]
    static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DocInfo1 di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter")]
    static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter")]
    static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter")]
    static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
    static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    class DocInfo1
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName = "NEUROVEND Ticket";
        [MarshalAs(UnmanagedType.LPStr)] public string? pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType = "RAW";
    }

    public static void Imprimir(string impresora, byte[] datos)
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            throw new PlatformNotSupportedException("La impresión RAW solo funciona en Windows");

        if (!OpenPrinter(impresora, out var hPrinter, IntPtr.Zero))
            throw new InvalidOperationException($"No se encontró la impresora: {impresora}");

        try
        {
            StartDocPrinter(hPrinter, 1, new DocInfo1());
            StartPagePrinter(hPrinter);

            var ptr = Marshal.AllocCoTaskMem(datos.Length);
            Marshal.Copy(datos, 0, ptr, datos.Length);
            WritePrinter(hPrinter, ptr, datos.Length, out _);
            Marshal.FreeCoTaskMem(ptr);

            EndPagePrinter(hPrinter);
            EndDocPrinter(hPrinter);
        }
        finally
        {
            ClosePrinter(hPrinter);
        }
    }
}
