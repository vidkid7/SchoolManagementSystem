/**
 * Login Page - Premium Modern Design
 */

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  keyframes,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School,
  Person,
  Lock,
  ArrowForward,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { login, clearError } from '../store/slices/authSlice';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
`;

const floatReverse = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(15px) rotate(-2deg); }
`;

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`;

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to appropriate page if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath);
    }
  }, [isAuthenticated, navigate]);

  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'Student':
        return '/portal/student';
      case 'Parent':
        return '/portal/parent';
      case 'Subject_Teacher':
      case 'Class_Teacher':
        return '/portal/teacher';
      case 'Accountant':
        return '/portal/accountant';
      case 'Librarian':
        return '/portal/librarian';
      case 'Transport_Manager':
        return '/portal/transport';
      case 'Hostel_Warden':
        return '/portal/hostel';
      case 'Non_Teaching_Staff':
        return '/portal/non-teaching-staff';
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(credentials));
    if (login.fulfilled.match(result)) {
      const user = result.payload?.user;
      const redirectPath = getRedirectPath(user?.role);
      navigate(redirectPath);
    }
  };

  const isNepali = i18n.language?.startsWith('ne');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Language Switcher */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
        <LanguageSwitcher />
      </Box>

      {/* Left Side - Branding */}
      {!isMobile && (
        <Box
          sx={{
            flex: { xs: 0, md: 1.2 },
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            backgroundSize: '200% 200%',
            animation: `${gradientMove} 10s ease infinite`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(ellipse at top left, rgba(102,126,234,0.3) 0%, transparent 50%)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '60%',
              height: '60%',
              background: 'radial-gradient(circle at bottom right, rgba(118,75,162,0.2) 0%, transparent 70%)',
            },
          }}
        >
          {/* Animated Stars */}
          {[...Array(12)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                borderRadius: '50%',
                background: 'white',
                animation: `${twinkle} ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
            />
          ))}

          {/* Floating Icons */}
          <Box sx={{ position: 'absolute', top: '15%', left: '10%', animation: `${float} 6s ease-in-out infinite` }}>
            <School sx={{ fontSize: 40, opacity: 0.3, color: '#667eea' }} />
          </Box>
          <Box sx={{ position: 'absolute', bottom: '20%', right: '15%', animation: `${floatReverse} 5s ease-in-out infinite` }}>
            <School sx={{ fontSize: 30, opacity: 0.2, color: '#764ba2' }} />
          </Box>
          
          <Box
            sx={{
              textAlign: 'center',
              zIndex: 1,
              px: 4,
              animation: `${fadeInUp} 1s ease-out`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${float} 4s ease-in-out infinite`,
              }}
            >
              <School sx={{ fontSize: 80, color: '#fff' }} />
            </Box>
            
            <Typography
              variant="h3"
              fontWeight={800}
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #fff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                letterSpacing: '-0.02em',
              }}
            >
              {t('app.title')}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                opacity: 0.8,
                maxWidth: 400,
                lineHeight: 1.8,
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.9)',
                mb: 2,
                textAlign: 'center',
                mx: 'auto',
              }}
            >
              {t('app.subtitle')}
            </Typography>

            {isNepali && (
              <Typography
                variant="h5"
                sx={{
                  opacity: 0.85,
                  mb: 3,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  fontStyle: 'italic',
                }}
              >
                {t('app.titleNepali')}
              </Typography>
            )}

            {/* Feature highlights */}
            <Box sx={{ mt: 5, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Smart Analytics', 'Easy Management', 'Secure'].map((feature, i) => (
                <Box
                  key={i}
                  sx={{
                    px: 2.5,
                    py: 1,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    animation: `${fadeInUp} 0.8s ease-out ${0.3 + i * 0.15}s both`,
                  }}
                >
                  {feature}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
          background: theme.palette.mode === 'dark'
            ? '#000000'
            : '#f3f4f6',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: theme.palette.mode === 'dark' ? 0.03 : 0.05,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23667eea' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }}
        />

        {/* Gradient Orbs */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Mobile Header */}
          {isMobile && (
            <Box sx={{ textAlign: 'center', mb: 5, animation: `${fadeInUp} 0.8s ease-out` }}>
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'inline-block',
                  boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
                }}
              >
                <School sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {t('app.title')}
              </Typography>
              {isNepali && (
                <Typography variant="body1" color="text.secondary">
                  {t('app.titleNepali')}
                </Typography>
              )}
            </Box>
          )}

          {/* Login Card */}
          <Box
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'rgba(28, 28, 30, 0.65)'
                : 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: { xs: 3, sm: 4 },
              boxShadow: theme.palette.mode === 'dark'
                ? '0 25px 80px rgba(0,0,0,0.5)'
                : '0 25px 80px rgba(0,0,0,0.05)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(255,255,255,0.4)',
              p: { xs: 4, sm: 5 },
              position: 'relative',
              overflow: 'hidden',
              animation: `${fadeInUp} 0.8s ease-out 0.2s both`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #667eea, #764ba2, #667eea)',
                backgroundSize: '200% 100%',
              },
            }}
          >
            {!isMobile && (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {t('auth.welcomeBack')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.signInToContinue')}
                </Typography>
              </Box>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  animation: `${fadeInUp} 0.5s ease-out`,
                  '& .MuiAlert-icon': { fontSize: 22 },
                }}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ '& > *': { animation: `${fadeInUp} 0.6s ease-out both` } }}
            >
              <Box sx={{ '& > *:nth-of-type(1)': { animationDelay: '0.3s' }, '& > *:nth-of-type(2)': { animationDelay: '0.4s' }, '& > *:nth-of-type(3)': { animationDelay: '0.5s' } }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label={t('auth.username')}
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'primary.main', opacity: 0.7 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.1)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 30px rgba(102,126,234,0.15)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'primary.main', opacity: 0.7 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isLoading}
                          sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        boxShadow: '0 4px 20px rgba(102,126,234,0.1)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 30px rgba(102,126,234,0.15)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                endIcon={isLoading ? null : <ArrowForward />}
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.8,
                  borderRadius: 2.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #475569 0%, #334155 100%)' 
                    : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                  backgroundSize: '200% 200%',
                  animation: `${gradientMove} 3s ease infinite`,
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 30px rgba(71,85,105,0.35)' 
                    : '0 8px 30px rgba(100,116,139,0.35)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundPosition: '100% 0',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 12px 40px rgba(71,85,105,0.45)' 
                      : '0 12px 40px rgba(100,116,139,0.45)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(71,85,105,0.5)' 
                      : 'rgba(100,116,139,0.5)',
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 3, textAlign: 'center', animation: `${fadeInUp} 0.6s ease-out 0.6s both` }}>
              <Typography variant="body2" sx={{ opacity: 0.6, fontSize: '0.85rem' }}>
                {t('auth.poweredBy')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
