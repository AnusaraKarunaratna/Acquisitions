import logger from '#config/logger.js';
import {getAllUsers, getUserById as getUserByIdService, updateUser as updateUserService, deleteUser as deleteUserService} from '#services/users.service.js';
import {updateUserSchema, userIdSchema} from '#validations/users.validation.js';
import {formatValidationError} from '#utils/format.js';
import {cookies} from '#utils/cookies.js';
import {jwttoken} from '#utils/jwt.js';

const getAuthenticatedUser = (req) => {
    if (req.user) {
        return {user: req.user};
    }

    const token = cookies.get(req, 'token');
    if (!token) {
        return {error: 'Authentication required', status: 401};
    }

    try {
        return {user: jwttoken.verify(token)};
    } catch {
        return {error: 'Invalid or expired token', status: 401};
    }
};

const canAccessTargetUser = (authUser, targetUserId) => {
    return Number(authUser.id) === targetUserId || authUser.role === 'admin';
};

export const fetchAllUsers = async (req, res, next) => {
    try{
        const auth = getAuthenticatedUser(req);
        if (!auth.user) {
            return res.status(auth.status).json({error: auth.error});
        }

        if (auth.user.role !== 'admin') {
            return res.status(403).json({error: 'Only admins can fetch all users'});
        }

        logger.info(`Fetching all users by requester: ${auth.user.id}`);
        const users = await getAllUsers(); 
        return res.json({
            message : 'Users fetched successfully',
            users : users,
            count : users.length
        });
    }catch(error){
        logger.error('Error fetching users', error);
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const paramsValidation = userIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(paramsValidation.error)
            });
        }

        const {id} = paramsValidation.data;
        const auth = getAuthenticatedUser(req);
        if (!auth.user) {
            return res.status(auth.status).json({error: auth.error});
        }

        if (!canAccessTargetUser(auth.user, id)) {
            return res.status(403).json({error: 'You can only access your own profile'});
        }

        logger.info(`Fetching user by id: ${id} by requester: ${auth.user.id}`);

        const user = await getUserByIdService(id);
        return res.status(200).json({
            message: 'User fetched successfully',
            user
        });
    } catch (error) {
        logger.error('Error fetching user by id', error);

        if (error.message === 'User not found') {
            return res.status(404).json({error: 'User not found'});
        }
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const paramsValidation = userIdSchema.safeParse(req.params);
        const bodyValidation = updateUserSchema.safeParse(req.body);

        if (!paramsValidation.success || !bodyValidation.success) {
            const validationError = !paramsValidation.success ? paramsValidation.error : bodyValidation.error;

            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationError)
            });
        }

        const auth = getAuthenticatedUser(req);
        if (!auth.user) {
            return res.status(auth.status).json({error: auth.error});
        }

        const {id} = paramsValidation.data;
        const updates = bodyValidation.data;
        const authUser = auth.user;

        if (!canAccessTargetUser(authUser, id)) {
            return res.status(403).json({error: 'You can only update your own profile'});
        }

        if (updates.role && authUser.role !== 'admin') {
            return res.status(403).json({error: 'Only admins can update user roles'});
        }

        logger.info(`Updating user id: ${id} by requester: ${authUser.id}`);
        const updatedUser = await updateUserService(id, updates);

        return res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        logger.error('Error updating user', error);

        if (error.message === 'User not found') {
            return res.status(404).json({error: 'User not found'});
        }

        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const paramsValidation = userIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(paramsValidation.error)
            });
        }

        const auth = getAuthenticatedUser(req);
        if (!auth.user) {
            return res.status(auth.status).json({error: auth.error});
        }

        const {id} = paramsValidation.data;
        const authUser = auth.user;
        if (!canAccessTargetUser(authUser, id)) {
            return res.status(403).json({error: 'You can only delete your own profile'});
        }

        logger.info(`Deleting user id: ${id} by requester: ${authUser.id}`);
        const deletedUser = await deleteUserService(id);

        return res.status(200).json({
            message: 'User deleted successfully',
            user: deletedUser
        });
    } catch (error) {
        logger.error('Error deleting user', error);

        if (error.message === 'User not found') {
            return res.status(404).json({error: 'User not found'});
        }

        next(error);
    }
};
