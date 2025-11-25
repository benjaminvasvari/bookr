/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.vizsgaremek.bookr.model;

import com.vizsgaremek.bookr.model.Staff;

import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author vben
 */
@Entity
@Table(name = "users")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Users.findAll", query = "SELECT u FROM Users u"),
    @NamedQuery(name = "Users.findById", query = "SELECT u FROM Users u WHERE u.id = :id"),
    @NamedQuery(name = "Users.findByFirstName", query = "SELECT u FROM Users u WHERE u.firstName = :firstName"),
    @NamedQuery(name = "Users.findByLastName", query = "SELECT u FROM Users u WHERE u.lastName = :lastName"),
    @NamedQuery(name = "Users.findByEmail", query = "SELECT u FROM Users u WHERE u.email = :email"),
    @NamedQuery(name = "Users.findByPhone", query = "SELECT u FROM Users u WHERE u.phone = :phone"),
    @NamedQuery(name = "Users.findByCreatedAt", query = "SELECT u FROM Users u WHERE u.createdAt = :createdAt"),
    @NamedQuery(name = "Users.findByUpdatedAt", query = "SELECT u FROM Users u WHERE u.updatedAt = :updatedAt"),
    @NamedQuery(name = "Users.findByDeletedAt", query = "SELECT u FROM Users u WHERE u.deletedAt = :deletedAt"),
    @NamedQuery(name = "Users.findByIsDeleted", query = "SELECT u FROM Users u WHERE u.isDeleted = :isDeleted"),
    @NamedQuery(name = "Users.findByLastLogin", query = "SELECT u FROM Users u WHERE u.lastLogin = :lastLogin"),
    @NamedQuery(name = "Users.findByRegisterFinishedAt", query = "SELECT u FROM Users u WHERE u.registerFinishedAt = :registerFinishedAt"),
    @NamedQuery(name = "Users.findByRegToken", query = "SELECT u FROM Users u WHERE u.regToken = :regToken"),
    @NamedQuery(name = "Users.findByIsActive", query = "SELECT u FROM Users u WHERE u.isActive = :isActive"),
    @NamedQuery(name = "Users.findByTwoFactorEnabled", query = "SELECT u FROM Users u WHERE u.twoFactorEnabled = :twoFactorEnabled"),
    @NamedQuery(name = "Users.findByTwoFactorSecret", query = "SELECT u FROM Users u WHERE u.twoFactorSecret = :twoFactorSecret"),
    @NamedQuery(name = "Users.findByTwoFactorConfirmedAt", query = "SELECT u FROM Users u WHERE u.twoFactorConfirmedAt = :twoFactorConfirmedAt")})
public class Users implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 100)
    @Column(name = "first_name")
    private String firstName;
    @Size(max = 100)
    @Column(name = "last_name")
    private String lastName;
    // @Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "email")
    private String email;
    @Basic(optional = false)
    @NotNull
    @Lob
    @Size(min = 1, max = 65535)
    @Column(name = "password")
    private String password;
    // @Pattern(regexp="^\\(?(\\d{3})\\)?[- ]?(\\d{3})[- ]?(\\d{4})$", message="Invalid phone/fax format, should be as xxx-xxx-xxxx")//if the field contains phone or fax number consider using this annotation to enforce field validation
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 30)
    @Column(name = "phone")
    private String phone;
    @Basic(optional = false)
    @NotNull
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_deleted")
    private boolean isDeleted;
    @Column(name = "last_login")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastLogin;
    @Column(name = "register_finished_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date registerFinishedAt;
    @Size(max = 64)
    @Column(name = "reg_token")
    private String regToken;
    @Basic(optional = false)
    @NotNull
    @Column(name = "is_active")
    private boolean isActive;
    @Basic(optional = false)
    @NotNull
    @Column(name = "two_factor_enabled")
    private boolean twoFactorEnabled;
    @Size(max = 32)
    @Column(name = "two_factor_secret")
    private String twoFactorSecret;
    @Column(name = "two_factor_confirmed_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date twoFactorConfirmedAt;
    @Lob
    @Size(max = 65535)
    @Column(name = "two_factor_recovery_codes")
    private String twoFactorRecoveryCodes;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "clientId")
    private Collection<Appointments> appointmentsCollection;
    @OneToMany(mappedBy = "cancelledBy")
    private Collection<Appointments> appointmentsCollection1;
    @OneToMany(mappedBy = "userId")
    private Collection<Images> imagesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<NotificationSettings> notificationSettingsCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<Staff> staffCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<AuditLogs> auditLogsCollection;
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne
    private Companies companyId;
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    @ManyToOne(optional = false)
    private Roles roleId;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "ownerId")
    private Collection<Companies> companiesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "clientId")
    private Collection<Reviews> reviewsCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<TwoFactorRecoveryCodes> twoFactorRecoveryCodesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<UserXRole> userXRoleCollection;

    @Transient
    private ArrayList<Roles> roles;

    @Transient
    private String rolesString;

    @Transient
    private String roleName;  // Az első role neve

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.vizsgaremek_bookr_war_1.0-SNAPSHOTPU");
    static SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public Users() {
    }

    public Users(Integer id) {
        this.id = id;
    }

    public Users(Integer id, String email, String password, String phone, Date createdAt, boolean isDeleted, boolean isActive, boolean twoFactorEnabled) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.createdAt = createdAt;
        this.isDeleted = isDeleted;
        this.isActive = isActive;
        this.twoFactorEnabled = twoFactorEnabled;
    }

    // clientRegister request
    public Users(String firstName, String lastName, String email, String password, String phone) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.phone = phone;
    }

    // login request constructor (email + password from frontend)
    public Users(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // login response constructor (data from stored procedure)
    public Users(Integer id, String firstName, String lastName, String email, String password, Integer companyId, Integer roleId, String rolesString) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;

        if (companyId != null) {
            this.companyId = new Companies(companyId);
        }

        if (roleId != null) {
            this.roleId = new Roles(roleId);
        }

        this.rolesString = rolesString;

        if (rolesString != null && !rolesString.isEmpty()) {
            this.roleName = rolesString.split(",")[0].trim();
        }
    }

    public Users(Integer id, String email, Date registerFinishedAt, boolean isActive, Companies companyId) {
        this.id = id;
        this.email = email;
        this.registerFinishedAt = registerFinishedAt;
        this.isActive = isActive;
        this.companyId = companyId;
    }

    public Integer getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Date getDeletedAt() {
        return deletedAt;
    }

    public boolean getIsDeleted() {
        return isDeleted;
    }

    public Date getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(Date lastLogin) {
        this.lastLogin = lastLogin;
    }

    public Date getRegisterFinishedAt() {
        return registerFinishedAt;
    }

    public void setRegisterFinishedAt(Date registerFinishedAt) {
        this.registerFinishedAt = registerFinishedAt;
    }

    public String getRegToken() {
        return regToken;
    }

    public void setRegToken(String regToken) {
        this.regToken = regToken;
    }

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public boolean getTwoFactorEnabled() {
        return twoFactorEnabled;
    }

    public void setTwoFactorEnabled(boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled;
    }

    public String getTwoFactorSecret() {
        return twoFactorSecret;
    }

    public void setTwoFactorSecret(String twoFactorSecret) {
        this.twoFactorSecret = twoFactorSecret;
    }

    public Date getTwoFactorConfirmedAt() {
        return twoFactorConfirmedAt;
    }

    public void setTwoFactorConfirmedAt(Date twoFactorConfirmedAt) {
        this.twoFactorConfirmedAt = twoFactorConfirmedAt;
    }

    public String getTwoFactorRecoveryCodes() {
        return twoFactorRecoveryCodes;
    }

    public void setTwoFactorRecoveryCodes(String twoFactorRecoveryCodes) {
        this.twoFactorRecoveryCodes = twoFactorRecoveryCodes;
    }

    public ArrayList<Roles> getRoles() {
        return roles;
    }

    public void setRoles(ArrayList<Roles> roles) {
        this.roles = roles;
    }

    public String getRolesString() {
        return rolesString;
    }

    public void setRolesString(String rolesString) {
        this.rolesString = rolesString;
    }

    public String getRoleName() {
        if (roleName != null) {
            return roleName;
        }
        // Ha nincs beállítva, kivesszük a rolesString első elemét
        if (rolesString != null && !rolesString.isEmpty()) {
            return rolesString.split(",")[0].trim();
        }
        return null;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    @XmlTransient
    public Collection<Appointments> getAppointmentsCollection() {
        return appointmentsCollection;
    }

    public void setAppointmentsCollection(Collection<Appointments> appointmentsCollection) {
        this.appointmentsCollection = appointmentsCollection;
    }

    @XmlTransient
    public Collection<Appointments> getAppointmentsCollection1() {
        return appointmentsCollection1;
    }

    public void setAppointmentsCollection1(Collection<Appointments> appointmentsCollection1) {
        this.appointmentsCollection1 = appointmentsCollection1;
    }

    @XmlTransient
    public Collection<Images> getImagesCollection() {
        return imagesCollection;
    }

    public void setImagesCollection(Collection<Images> imagesCollection) {
        this.imagesCollection = imagesCollection;
    }

    @XmlTransient
    public Collection<NotificationSettings> getNotificationSettingsCollection() {
        return notificationSettingsCollection;
    }

    public void setNotificationSettingsCollection(Collection<NotificationSettings> notificationSettingsCollection) {
        this.notificationSettingsCollection = notificationSettingsCollection;
    }

    @XmlTransient
    public Collection<Staff> getStaffCollection() {
        return staffCollection;
    }

    public void setStaffCollection(Collection<Staff> staffCollection) {
        this.staffCollection = staffCollection;
    }

    @XmlTransient
    public Collection<AuditLogs> getAuditLogsCollection() {
        return auditLogsCollection;
    }

    public void setAuditLogsCollection(Collection<AuditLogs> auditLogsCollection) {
        this.auditLogsCollection = auditLogsCollection;
    }

    public Companies getCompanyId() {
        return companyId;
    }

    /**
     * Helper method for JWT - returns company ID as Integer
     */
    public Integer getCompanyIdAsInteger() {
        return companyId != null ? companyId.getId() : null;
    }

    public void setCompanyId(Companies companyId) {
        this.companyId = companyId;
    }

    public Roles getRoleId() {
        return roleId;
    }

    /**
     * Helper method for JWT - returns role ID as Integer
     */
    public Integer getRoleIdAsInteger() {
        return roleId != null ? roleId.getId() : null;
    }

    public void setRoleId(Roles roleId) {
        this.roleId = roleId;
    }

    @XmlTransient
    public Collection<Companies> getCompaniesCollection() {
        return companiesCollection;
    }

    public void setCompaniesCollection(Collection<Companies> companiesCollection) {
        this.companiesCollection = companiesCollection;
    }

    @XmlTransient
    public Collection<Reviews> getReviewsCollection() {
        return reviewsCollection;
    }

    public void setReviewsCollection(Collection<Reviews> reviewsCollection) {
        this.reviewsCollection = reviewsCollection;
    }

    @XmlTransient
    public Collection<TwoFactorRecoveryCodes> getTwoFactorRecoveryCodesCollection() {
        return twoFactorRecoveryCodesCollection;
    }

    public void setTwoFactorRecoveryCodesCollection(Collection<TwoFactorRecoveryCodes> twoFactorRecoveryCodesCollection) {
        this.twoFactorRecoveryCodesCollection = twoFactorRecoveryCodesCollection;
    }

    @XmlTransient
    public Collection<UserXRole> getUserXRoleCollection() {
        return userXRoleCollection;
    }

    public void setUserXRoleCollection(Collection<UserXRole> userXRoleCollection) {
        this.userXRoleCollection = userXRoleCollection;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof Users)) {
            return false;
        }
        Users other = (Users) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.vizsgaremek.bookr.model.Users[ id=" + id + " ]";
    }

    // ----------- TÁROLT ELJÁRÁS MEGHÍVÁSOK------------
    public static RegistrationResult clientRegister(Users clientRegistered) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("registerClient");
            spq.registerStoredProcedureParameter("firstNameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("lastNameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("passwordIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("phoneIN", String.class, ParameterMode.IN);

            spq.setParameter("firstNameIN", clientRegistered.getFirstName());
            spq.setParameter("lastNameIN", clientRegistered.getLastName());
            spq.setParameter("emailIN", clientRegistered.getEmail());
            spq.setParameter("passwordIN", clientRegistered.getPassword());
            spq.setParameter("phoneIN", clientRegistered.getPhone());

            spq.execute();

            // Get the result set with user_id and reg_token
            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] result = resultList.get(0);
            int userId = Integer.parseInt(result[0].toString());
            String regToken = result[1].toString();

            return new RegistrationResult(userId, regToken);

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static RegistrationResult staffRegister(Users staffRegistered) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("registerStaff");
            spq.registerStoredProcedureParameter("firstNameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("lastNameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("passwordIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("phoneIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("companyIdIN", String.class, ParameterMode.IN);

            spq.setParameter("firstNameIN", staffRegistered.getFirstName());
            spq.setParameter("lastNameIN", staffRegistered.getLastName());
            spq.setParameter("emailIN", staffRegistered.getEmail());
            spq.setParameter("passwordIN", staffRegistered.getPassword());
            spq.setParameter("phoneIN", staffRegistered.getPhone());
            spq.setParameter("companyIdIN", staffRegistered.getCompanyId());

            spq.execute();

            // Get the result set with user_id, staff_id and reg_token
            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] result = resultList.get(0);
            int userId = Integer.parseInt(result[0].toString());
            // result[1] is staff_id, we don't need it for RegistrationResult
            String regToken = result[2].toString();

            return new RegistrationResult(userId, regToken);

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    /**
     * Login method - retrieves user data by email (password verification
     * happens in Service layer)
     *
     * @param loginUser User object containing email (and password for service
     * verification)
     * @return Users object with all data including hashed password and roles as
     * String
     */
    public static Users login(Users loginUser) {
        EntityManager em = emf.createEntityManager();

        try {
            // Call stored procedure with ONLY email parameter
            StoredProcedureQuery loginQuery = em.createStoredProcedureQuery("login");
            loginQuery.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            loginQuery.setParameter("emailIN", loginUser.getEmail());

            loginQuery.execute();

            List<Object[]> resultList = loginQuery.getResultList();

            // If no user found, return null
            if (resultList.isEmpty()) {
                return null;
            }

            // Process the result (should be only 1 row due to LIMIT 1)
            Object[] record = resultList.get(0);

            Users user = new Users(
                    Integer.valueOf(record[0].toString()), // user_id
                    record[1].toString(), // first_name
                    record[2].toString(), // last_name
                    record[3].toString(), // email
                    record[4].toString(), // password (hashed)
                    record[5] == null ? null : Integer.valueOf(record[5].toString()), // company_id (can be NULL)
                    record[6] == null ? null : Integer.valueOf(record[6].toString()), // role_id (should NOT be NULL)
                    record[7] == null ? null : record[7].toString() // roles (GROUP_CONCAT string)
            );

            return user;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }

    public static Boolean updateLastLogin(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("updateLastLogin");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public static Boolean activateUserByRegToken(String token) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("activateUserByRegToken");
            spq.registerStoredProcedureParameter("tokenIN", String.class, ParameterMode.IN);

            spq.setParameter("tokenIN", token);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public static Users getUserByRegToken(String token) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserByRegToken");

            // Token STRING, nem Integer!
            spq.registerStoredProcedureParameter("tokenIN", String.class, ParameterMode.IN);
            spq.setParameter("tokenIN", token);

            spq.execute();
            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Első (és egyetlen) rekord
            Object[] record = resultList.get(0);

            // Company ID kezelése (lehet NULL)
            Companies company = null;
            if (record[4] != null) {
                Integer companyId = Integer.valueOf(record[4].toString());
                company = em.find(Companies.class, companyId);
            }

            // User objektum összeállítása
            Users user = new Users(
                    Integer.valueOf(record[0].toString()), // id
                    record[1].toString(), // email
                    record[2] == null ? null : formatter.parse(record[2].toString()), // register_finished_at (2-es index!)
                    Boolean.parseBoolean(record[3].toString()), // isActive
                    company // Companies objektum
            );

            return user;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        } finally {
            if (em != null && em.isOpen()) {
                em.close();
            }
        }
    }
    
        public static Users getUserById(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserById"); //ami az sql tárolt      
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN); //
            spq.setParameter("idIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();
            Users toReturn = new Users();

            for (Object[] record : resultList) { // thats a foreach

                Users u = new Users(
                        Integer.valueOf(record[0].toString()), //id
                        record[1].toString(), //first_name
                        record[2].toString(), //last_name
                        record[4].toString(), // email
                        record[5].toString(), // phone
                        record[6] == null ? null : Integer.valueOf(record[6].toString()), //login_at
                        formatter.parse(record[7].toString()), //created_at
                        record[8] == null ? null : formatter.parse(record[8].toString()), //login_at
                        record[8] == null ? null : formatter.parse(record[9].toString()) //register_finished_at 

                );

                toReturn = u;

            }

            return toReturn;

        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
    }
}
