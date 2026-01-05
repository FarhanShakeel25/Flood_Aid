namespace FloodAid.Api.Enums
{
    public enum UserRole
    {
        /// <summary>
        /// Volunteer assigned to a specific city
        /// </summary>
        Volunteer = 0,
        
        /// <summary>
        /// Donor (can be public or managed)
        /// </summary>
        Donor = 1,
        
        /// <summary>
        /// Both volunteer and donor
        /// </summary>
        Both = 2,
        
        /// <summary>
        /// Admin managing cities within a province
        /// </summary>
        ProvinceAdmin = 3,
        
        /// <summary>
        /// Super admin with full system access
        /// </summary>
        SuperAdmin = 4
    }
}
