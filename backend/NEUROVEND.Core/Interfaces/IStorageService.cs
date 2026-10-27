namespace NEUROVEND.Core.Interfaces;

public interface IStorageService
{
    Task<string> UploadImagenProductoAsync(Stream imageStream, string fileName, string contentType);
    Task DeleteImagenProductoAsync(string imageUrl);
}
