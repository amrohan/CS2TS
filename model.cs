public class UserProfile
{
    private int userId;

    protected string password;
    public string FullName { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; }

}