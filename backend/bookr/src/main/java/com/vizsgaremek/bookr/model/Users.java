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
    @NamedQuery(name = "Users.findByGuid", query = "SELECT u FROM Users u WHERE u.guid = :guid"),
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
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 36)
    @Column(name = "guid")
    private String guid;
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
    @Column(name = "company_id", insertable = false, updatable = false)
    private Integer companyId;
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
    @JoinColumn(name = "company_id", referencedColumnName = "id")
    @ManyToOne
    private Companies company;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "ownerId")
    private Collection<Companies> companiesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "clientId")
    private Collection<Reviews> reviewsCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<TwoFactorRecoveryCodes> twoFactorRecoveryCodesCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<Tokens> tokensCollection;
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "userId")
    private Collection<UserXRole> userXRoleCollection;

    @Transient
    private ArrayList<Roles> roles;

    @Transient
    private Integer roleId;

    @Transient
    private String rolesString;

    @Transient
    private String roleName;  // Az első role neve

    @Transient
    private String imageUrl;

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
    public Users(Integer id, String firstName, String lastName, String email, String password, Integer companyId, String avatarUrl, String rolesString) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.companyId = companyId;
        this.imageUrl = imageUrl;
        this.rolesString = rolesString;

        if (rolesString != null && !rolesString.isEmpty()) {
            this.roleName = rolesString.split(",")[0].trim();
        }
    }

    // getUserByRegToken constructor
    public Users(Integer id, String email, Date registerFinishedAt, boolean isActive) {
        this.id = id;
        this.email = email;
        this.registerFinishedAt = registerFinishedAt;
        this.isActive = isActive;
    }

    // getUserById
    public Users(Integer id, String firstName, String lastName, String email, String phone, String imageUrl, Integer companyId, String rolesString, Date createdAt, Date lastLogin, Boolean isDeleted, Boolean isActive) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.imageUrl = imageUrl;
        this.companyId = companyId;
        this.rolesString = rolesString;
        this.createdAt = createdAt;
        this.lastLogin = lastLogin;
        this.isDeleted = isDeleted;
        this.isActive = isActive;

    }

    // getUserProfile
    public Users(Integer id, String firstName, String lastName, String email, String phone, String imageUrl, Date createdAt) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
    }

    // logout
    public Users(Integer id, String email, Integer companyId) {
        this.id = id;
        this.email = email;
        this.companyId = companyId;
    }

    // checkUser
    public Users(boolean isDeleted, boolean isActive) {
        this.isDeleted = isDeleted;
        this.isActive = isActive;
    }

    // updateUser request & response
    public Users(Integer id, String firstName, String lastName, String email, String phone) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
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

    public Integer getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Integer companyId) {
        this.companyId = companyId;
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

    public Companies getCompany() {
        return company;
    }

    public Integer getRoleId() {
        return roleId;
    }

    /**
     * Helper method for JWT - returns role ID as Integer
     */
    public Integer getRoleIdAsInteger() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String avatarUrl) {
        this.imageUrl = avatarUrl;
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
                    record[6] == null ? null : record[6].toString(), // avatarUrl
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

            spq.registerStoredProcedureParameter("tokenIN", String.class, ParameterMode.IN);
            spq.setParameter("tokenIN", token);

            spq.execute();
            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            Object[] record = resultList.get(0);

            // User objektum összeállítása
            Users user = new Users(
                    Integer.valueOf(record[0].toString()), // id
                    record[1].toString(), // email
                    record[2] == null ? null : formatter.parse(record[2].toString()), // register_finished_at
                    Boolean.parseBoolean(record[3].toString()) // isActive
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
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserById");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("userIdIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Users user = new Users(
                    Integer.valueOf(record[0].toString()), // id
                    record[1].toString(), // first_name
                    record[2].toString(), // last_name
                    record[3].toString(), // email
                    record[4].toString(), // phone
                    record[5] == null ? null : record[5].toString(), // imageUrl
                    record[6] == null ? null : Integer.valueOf(record[6].toString()), // company_id
                    record[7].toString(),
                    formatter.parse(record[8].toString()),
                    record[9] == null ? null : formatter.parse(record[9].toString()), // last login
                    record[10] == null ? null : Boolean.parseBoolean(record[10].toString()),
                    record[11] == null ? null : Boolean.parseBoolean(record[11].toString())
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

    public static Users checkUser(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("checkUser");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);

            spq.setParameter("idIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Users user = new Users(
                    Boolean.parseBoolean(record[0].toString()),
                    Boolean.parseBoolean(record[1].toString())
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

    public static Users getUserProfile(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getUserProfile");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);
            spq.setParameter("userIdIN", id);

            spq.execute();

            List<Object[]> resultList = spq.getResultList();

            if (resultList.isEmpty()) {
                return null;
            }

            // Csak az első rekord kell (LIMIT 1 a stored procedure-ben)
            Object[] record = resultList.get(0);

            Users user = new Users(
                    Integer.valueOf(record[0].toString()), // id
                    record[1].toString(), // first_name
                    record[2].toString(), // last_name
                    record[3].toString(), // email
                    record[4].toString(), // phone
                    record[5] == null ? null : record[5].toString(), // imageUrl
                    formatter.parse(record[6].toString())
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

    public static Boolean softDeleteUser(Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("softDeleteUser");
            spq.registerStoredProcedureParameter("userIdIN", Integer.class, ParameterMode.IN);

            spq.setParameter("userIdIN", userId);

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public static Boolean updateUser(Users updatedUser) {
        EntityManager em = emf.createEntityManager();

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("updateUser");
            spq.registerStoredProcedureParameter("idIN", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("firstNameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("lastNameIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("emailIN", String.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("phoneIN", String.class, ParameterMode.IN);

            spq.setParameter("idIN", updatedUser.getId());
            spq.setParameter("firstNameIN", updatedUser.getFirstName());
            spq.setParameter("lastNameIN", updatedUser.getLastName());
            spq.setParameter("emailIN", updatedUser.getEmail());
            spq.setParameter("phoneIN", updatedUser.getPhone());

            spq.execute();

            return true;

        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }
}
